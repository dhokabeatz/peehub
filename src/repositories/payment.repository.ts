import { db, type PrismaTransactionClient } from '@/lib/db'
import type { Decimal } from '@prisma/client/runtime/library'
import type { TransactionStatus } from '@prisma/client'

const ADMIN_PAYMENT_SELECT = {
  id: true,
  userId: true,
  walletId: true,
  amount: true,
  provider: true,
  providerReference: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
} as const

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getPaymentByReference(reference: string) {
  return db.paymentTransaction.findUnique({
    where: { providerReference: reference },
    select: {
      id: true,
      userId: true,
      walletId: true,
      amount: true,
      provider: true,
      providerReference: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getAdminPaymentMetrics() {
  const [pendingPaymentCount, walletFundingValue] = await Promise.all([
    db.paymentTransaction.count({
      where: { status: 'pending' },
    }),
    db.paymentTransaction.aggregate({
      where: { status: 'success' },
      _sum: { amount: true },
    }),
  ])

  return {
    pendingPaymentCount,
    totalWalletFundingValue: walletFundingValue._sum.amount,
  }
}

export async function getAdminPayments(filter?: {
  status?: TransactionStatus
  provider?: 'paystack' | 'manual'
  take?: number
}) {
  return db.paymentTransaction.findMany({
    where: {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.provider ? { provider: filter.provider } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filter?.take ?? 100,
    select: ADMIN_PAYMENT_SELECT,
  })
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createPaymentTransaction(data: {
  userId: string
  walletId: string
  amount: Decimal
  provider: string
  reference: string
}) {
  return db.paymentTransaction.create({
    data: {
      userId: data.userId,
      walletId: data.walletId,
      amount: data.amount,
      provider: data.provider,
      providerReference: data.reference,
      status: 'pending',
    },
    select: {
      id: true,
      userId: true,
      walletId: true,
      amount: true,
      provider: true,
      providerReference: true,
      status: true,
      createdAt: true,
    },
  })
}

// ─── Write (transaction-only) ─────────────────────────────────────────────────

/**
 * Locks the payment_transactions row FOR UPDATE and returns it.
 * Must be called inside a db.$transaction().
 *
 * Why SELECT FOR UPDATE here:
 *   Two concurrent admin confirms for the same reference would both read
 *   status=pending and both proceed to credit. The row lock means only one
 *   can hold it at a time — the second blocks until the first commits and
 *   then re-reads status=success, aborting cleanly.
 */
export async function lockAndGetPaymentTx(
  tx: PrismaTransactionClient,
  reference: string,
): Promise<{
  id: string
  status: TransactionStatus
  amount: string
  walletId: string
  userId: string
} | null> {
  const rows = await tx.$queryRaw<
    Array<{
      id: string
      status: string
      amount: string
      wallet_id: string
      user_id: string
    }>
  >`
    SELECT id::text, status::text, amount::text, wallet_id::text, user_id::text
    FROM payment_transactions
    WHERE provider_reference = ${reference}
    FOR UPDATE
  `

  if (!rows.length) return null

  return {
    id: rows[0].id,
    status: rows[0].status as TransactionStatus,
    amount: rows[0].amount,
    walletId: rows[0].wallet_id,
    userId: rows[0].user_id,
  }
}

export async function updatePaymentStatusTx(
  tx: PrismaTransactionClient,
  paymentId: string,
  status: TransactionStatus,
) {
  return tx.paymentTransaction.update({
    where: { id: paymentId },
    data: { status },
    select: { id: true, status: true },
  })
}
