import { db, type PrismaTransactionClient } from '@/lib/db'
import type { Decimal } from '@prisma/client/runtime/library'
import type { OrderStatus } from '@prisma/client'

// Select shape returned to callers — includes bundle and network details.
// Consistent between createOrderTx, getOrderById, getOrdersByUserId.
const ORDER_SELECT = {
  id: true,
  userId: true,
  recipientPhone: true,
  amount: true,
  status: true,
  providerReference: true,
  adminNote: true,
  walletTransactionId: true,
  refundWalletTransactionId: true,
  createdAt: true,
  updatedAt: true,
  bundle: {
    select: {
      id: true,
      name: true,
      dataSizeMb: true,
      validityDays: true,
    },
  },
  network: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
} as const

// ─── Write (transaction-only) ─────────────────────────────────────────────────

export async function createOrderTx(
  tx: PrismaTransactionClient,
  data: {
    userId: string
    bundleId: string
    networkId: string
    walletTransactionId: string
    recipientPhone: string
    amount: Decimal
  },
) {
  return tx.order.create({
    data,
    select: ORDER_SELECT,
  })
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getOrdersByUserId(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: ORDER_SELECT,
  })
}

export async function getOrderById(orderId: string) {
  // ORDER_SELECT already includes userId — present here for the ownership check in OrderService
  return db.order.findUnique({
    where: { id: orderId },
    select: ORDER_SELECT,
  })
}

// ─── Admin read ───────────────────────────────────────────────────────────────

// Extended select for admin views — adds user identity and wallet tx reference.
const ADMIN_ORDER_SELECT = {
  ...ORDER_SELECT,
  processedBy: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
  walletTransaction: {
    select: {
      id: true,
      reference: true,
      amount: true,
      status: true,
    },
  },
  refundWalletTransaction: {
    select: {
      id: true,
      reference: true,
      amount: true,
      status: true,
    },
  },
} as const

export async function getAllOrders(filter?: { status?: OrderStatus }) {
  return db.order.findMany({
    where: filter?.status ? { status: filter.status } : undefined,
    orderBy: { createdAt: 'desc' },
    select: ADMIN_ORDER_SELECT,
  })
}

export async function getOrderByIdAdmin(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    select: ADMIN_ORDER_SELECT,
  })
}

// ─── Admin write ──────────────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  data: {
    status: 'processing' | 'completed' | 'failed' | 'cancelled'
    adminNote?: string
    processedBy?: string
    providerReference?: string
  },
) {
  return db.order.update({
    where: { id: orderId },
    data,
    select: ADMIN_ORDER_SELECT,
  })
}

/**
 * Locks the orders row FOR UPDATE and returns the minimal fields needed for
 * the refund decision. Must be called inside a db.$transaction().
 *
 * Why FOR UPDATE:
 *   Two concurrent PATCH requests for the same order (e.g. double-click) would
 *   both read refundWalletTransactionId=null and both proceed to issue a refund.
 *   The row lock means only one can hold it at a time — the second blocks until
 *   the first commits, then re-reads and finds the refund already linked.
 */
export async function lockOrderForRefundTx(
  tx: PrismaTransactionClient,
  orderId: string,
): Promise<{
  id: string
  status: OrderStatus
  amount: string
  userId: string
  refundWalletTransactionId: string | null
} | null> {
  const rows = await tx.$queryRaw<
    Array<{
      id: string
      status: string
      amount: string
      user_id: string
      refund_wallet_transaction_id: string | null
    }>
  >`
    SELECT id::text, status::text, amount::text, user_id::text,
           refund_wallet_transaction_id::text
    FROM orders
    WHERE id = ${orderId}::uuid
    FOR UPDATE
  `

  if (!rows.length) return null

  return {
    id: rows[0].id,
    status: rows[0].status as OrderStatus,
    amount: rows[0].amount,
    userId: rows[0].user_id,
    refundWalletTransactionId: rows[0].refund_wallet_transaction_id ?? null,
  }
}

/**
 * Updates order status inside an existing db.$transaction().
 * Accepts refundWalletTransactionId so the refund link and status change are
 * written in the same atomic operation.
 */
export async function updateOrderStatusTx(
  tx: PrismaTransactionClient,
  orderId: string,
  data: {
    status: 'processing' | 'completed' | 'failed' | 'cancelled'
    adminNote?: string
    processedBy?: string
    providerReference?: string
    refundWalletTransactionId?: string
  },
) {
  return tx.order.update({
    where: { id: orderId },
    data,
    select: ADMIN_ORDER_SELECT,
  })
}
