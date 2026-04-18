import { db, Prisma, type PrismaTransactionClient } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { InsufficientBalanceError, WalletNotFoundError } from '@/lib/errors/order.errors'

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getWalletByUserId(userId: string) {
  return db.wallet.findUnique({
    where: { userId },
    select: { id: true, userId: true, balance: true },
  })
}

// ─── Write (transaction-only) ─────────────────────────────────────────────────

/**
 * Debits the wallet inside an existing db.$transaction().
 *
 * Why SELECT FOR UPDATE:
 *   Without a row lock, two concurrent orders could both read balance=50,
 *   both pass the check, and both debit — resulting in balance=-X.
 *   SELECT FOR UPDATE acquires an exclusive row lock until the transaction
 *   commits, so the second concurrent debit blocks until the first completes.
 *
 * Never call this outside a db.$transaction() — the lock has no effect there.
 */
export async function debitWalletTx(
  tx: PrismaTransactionClient,
  walletId: string,
  userId: string,
  amount: Decimal,
  description: string,
  reference: string,
): Promise<{ id: string }> {
  // 0. Guard: reject degenerate amounts before touching the DB
  if (amount.lte(0)) {
    throw new Error(`Debit amount must be positive, got ${amount.toString()}`)
  }

  // 1. Lock the wallet row and read the current balance atomically.
  //    Both id AND user_id are checked so a wallet belonging to a different
  //    user can never be debited even if a walletId is somehow guessed.
  //    balance::text preserves decimal precision in the raw query result.
  const rows = await tx.$queryRaw<Array<{ balance: string }>>`
    SELECT balance::text FROM wallets
    WHERE id = ${walletId}::uuid
      AND user_id = ${userId}::uuid
    FOR UPDATE
  `

  if (!rows.length) throw new WalletNotFoundError()

  const currentBalance = new Decimal(rows[0].balance)

  // 2. Reject if balance is insufficient
  if (currentBalance.lt(amount)) throw new InsufficientBalanceError()

  const balanceBefore = currentBalance
  const balanceAfter = currentBalance.minus(amount)

  // 3. Update the wallet balance
  await tx.wallet.update({
    where: { id: walletId },
    data: { balance: balanceAfter },
  })

  // 4. Create the immutable wallet transaction record
  const walletTx = await tx.walletTransaction.create({
    data: {
      walletId,
      userId,
      type: 'debit',
      amount,
      balanceBefore,
      balanceAfter,
      reference,
      description,
      status: 'success',
    },
    select: { id: true },
  })

  return walletTx
}

/**
 * Credits the wallet inside an existing db.$transaction().
 *
 * Mirrors debitWalletTx exactly — SELECT FOR UPDATE prevents a concurrent
 * debit from reading a stale balance while this credit is in-flight.
 *
 * Never call this outside a db.$transaction().
 */
export async function creditWalletTx(
  tx: PrismaTransactionClient,
  walletId: string,
  userId: string,
  amount: Decimal,
  description: string,
  reference: string,
  metadata?: Prisma.InputJsonValue,
): Promise<{ id: string }> {
  if (amount.lte(0)) {
    throw new Error(`Credit amount must be positive, got ${amount.toString()}`)
  }

  // 1. Lock the wallet row and read the current balance atomically.
  const rows = await tx.$queryRaw<Array<{ balance: string }>>`
    SELECT balance::text FROM wallets
    WHERE id = ${walletId}::uuid
      AND user_id = ${userId}::uuid
    FOR UPDATE
  `

  if (!rows.length) throw new WalletNotFoundError()

  const currentBalance = new Decimal(rows[0].balance)
  const balanceBefore = currentBalance
  const balanceAfter = currentBalance.plus(amount)

  // 2. Update the wallet balance
  await tx.wallet.update({
    where: { id: walletId },
    data: { balance: balanceAfter },
  })

  // 3. Create the immutable wallet transaction record.
  //    reference is @unique — a duplicate confirm attempt that somehow bypasses
  //    the payment lock will fail here with a constraint violation, not a double credit.
  const walletTx = await tx.walletTransaction.create({
    data: {
      walletId,
      userId,
      type: 'credit',
      amount,
      balanceBefore,
      balanceAfter,
      reference,
      description,
      status: 'success',
      ...(metadata !== undefined ? { metadata } : {}),
    },
    select: { id: true },
  })

  return walletTx
}
