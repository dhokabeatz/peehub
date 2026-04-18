import { db } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { getBundleById } from '@/repositories/bundle.repository'
import { getWalletByUserId, debitWalletTx, creditWalletTx } from '@/repositories/wallet.repository'
import {
  createOrderTx,
  getOrdersByUserId,
  getOrderById as dbGetOrderById,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus as dbUpdateOrderStatus,
  lockOrderForRefundTx,
  updateOrderStatusTx,
} from '@/repositories/order.repository'
import { generateReference } from '@/lib/utils/reference'
import { detectNetwork, normalizePhone } from '@/lib/utils/phone'
import { ROLES } from '@/constants/roles'
import type { OrderStatus } from '@prisma/client'
import {
  BundleNotFoundError,
  UnknownNetworkError,
  NetworkMismatchError,
  WalletNotFoundError,
} from '@/lib/errors/order.errors'
import { OrderNotFoundError, InvalidStatusTransitionError, AlreadyRefundedError } from '@/lib/errors/admin.errors'

// Valid status transitions — terminal states (completed, failed, cancelled) have no outgoing edges.
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ['processing', 'cancelled'],
  processing: ['completed', 'failed', 'cancelled'],
  completed:  [],
  failed:     [],
  cancelled:  [],
}

// No Next.js imports — framework-free and unit-testable.

export class OrderService {
  async placeOrder(userId: string, input: { bundleId: string; recipientPhone: string }) {
    // ── Step 1: Validate bundle ──────────────────────────────────────────────
    // Done outside the transaction — DB reads before acquiring locks keep
    // the critical section (the $transaction below) as short as possible.
    const bundle = await getBundleById(input.bundleId)
    if (!bundle || !bundle.isActive) throw new BundleNotFoundError()

    // ── Step 2: Detect network from recipient phone ──────────────────────────
    const detectedCode = detectNetwork(input.recipientPhone)
    if (!detectedCode) throw new UnknownNetworkError()

    // ── Step 3: Validate network matches the bundle ──────────────────────────
    // Prevents e.g. MTN bundle being ordered for a Telecel number.
    if (detectedCode !== bundle.network.code) {
      throw new NetworkMismatchError(detectedCode, bundle.network.code)
    }

    // ── Step 4: Validate wallet exists ───────────────────────────────────────
    const wallet = await getWalletByUserId(userId)
    if (!wallet) throw new WalletNotFoundError()

    // ── Step 5: Normalise phone before persisting ────────────────────────────
    const recipientPhone = normalizePhone(input.recipientPhone) ?? input.recipientPhone

    // ── Step 6: Generate reference BEFORE the transaction ───────────────────
    // Side effects (randomBytes) must not happen inside $transaction — any
    // error inside the callback causes a retry and we'd generate duplicate refs.
    // WTX prefix identifies this as a wallet transaction reference (vs ORD for orders).
    const reference = generateReference('WTX')

    // ── Step 7: Atomic debit + order creation ────────────────────────────────
    // Only DB writes happen inside this block. No external API calls.
    // Order is always created with status=pending — admin fulfils manually.
    const order = await db.$transaction(async (tx) => {
      // Lock wallet row → check balance → debit → create WalletTransaction
      const walletTx = await debitWalletTx(
        tx,
        wallet.id,
        userId,
        bundle.price,
        `Bundle: ${bundle.name} → ${recipientPhone}`,
        reference,
      )

      // Create Order linked to the WalletTransaction
      return createOrderTx(tx, {
        userId,
        bundleId: bundle.id,
        networkId: bundle.networkId,
        walletTransactionId: walletTx.id,
        recipientPhone,
        amount: bundle.price,
      })
    })

    return order
  }

  async getUserOrders(userId: string) {
    return getOrdersByUserId(userId)
  }

  async getOrderById(orderId: string, requesterId: string, requesterRole: string) {
    const order = await dbGetOrderById(orderId)
    if (!order) return null

    // Non-admins can only see their own orders.
    // Return null (not a 403) to avoid leaking that the order exists.
    if (requesterRole !== ROLES.ADMIN && order.userId !== requesterId) {
      return null
    }

    return order
  }

  async updateOrderStatus(
    orderId: string,
    data: {
      status: 'processing' | 'completed' | 'failed' | 'cancelled'
      adminNote?: string
      providerReference?: string
    },
    adminId: string,
  ) {
    // TODO: Phase 5 — if status=failed, trigger wallet refund
    return dbUpdateOrderStatus(orderId, { ...data, processedBy: adminId })
  }

  // ── Admin methods ─────────────────────────────────────────────────────────

  async adminListOrders(filter?: { status?: OrderStatus }) {
    return getAllOrders(filter)
  }

  async adminGetOrder(orderId: string) {
    return getOrderByIdAdmin(orderId)
  }

  async adminUpdateStatus(
    orderId: string,
    data: {
      status: 'processing' | 'completed' | 'failed' | 'cancelled'
      adminNote?: string
      providerReference?: string
    },
    adminId: string,
  ) {
    const order = await getOrderByIdAdmin(orderId)
    if (!order) throw new OrderNotFoundError()

    const allowed = VALID_TRANSITIONS[order.status]
    if (!allowed.includes(data.status as OrderStatus)) {
      throw new InvalidStatusTransitionError(order.status, data.status)
    }

    // ── Non-failed transitions: simple status update, no refund ──────────────
    if (data.status !== 'failed') {
      return dbUpdateOrderStatus(orderId, { ...data, processedBy: adminId })
    }

    // ── Failed: auto-refund the original debit amount ─────────────────────────
    //
    // Design:
    //   1. Fetch wallet ID before the transaction (only needs the ID; creditWalletTx
    //      re-reads balance with SELECT FOR UPDATE inside the transaction).
    //   2. Generate the refund reference outside the transaction — randomBytes must
    //      not run inside $transaction because a retry would produce a duplicate ref.
    //   3. Inside $transaction:
    //        a. Lock the order row (FOR UPDATE) and re-validate transition.
    //        b. Check refundWalletTransactionId IS NULL — definitive double-refund guard.
    //        c. Credit the wallet (locks wallet row, updates balance, creates WalletTransaction).
    //        d. Update order status + link refundWalletTransactionId atomically.
    //   Everything rolls back if any step throws.

    const wallet = await getWalletByUserId(order.userId)
    if (!wallet) throw new WalletNotFoundError()

    // Generate outside $transaction — side effects must not be inside the callback.
    const refundRef = generateReference('RFD')

    return db.$transaction(async (tx) => {
      // (a) Lock order row — blocks concurrent PATCH on this order.
      const locked = await lockOrderForRefundTx(tx, orderId)
      if (!locked) throw new OrderNotFoundError()

      // Re-validate inside the lock: guards against a concurrent status change
      // that happened between the pre-check above and acquiring the lock.
      const allowedNow = VALID_TRANSITIONS[locked.status]
      if (!allowedNow.includes('failed' as OrderStatus)) {
        throw new InvalidStatusTransitionError(locked.status, 'failed')
      }

      // (b) Definitive double-refund guard.
      //     The row lock ensures no concurrent request can set this between
      //     our check and our write below.
      if (locked.refundWalletTransactionId !== null) {
        throw new AlreadyRefundedError()
      }

      // (c) Credit wallet — SELECT FOR UPDATE on wallet row, updates balance,
      //     creates WalletTransaction. WalletTransaction.reference is @unique,
      //     so a duplicate refundRef would throw a constraint error, not silently succeed.
      const refundTx = await creditWalletTx(
        tx,
        wallet.id,
        order.userId,
        new Decimal(locked.amount),
        `Refund: order ${orderId.slice(0, 8)}`,
        refundRef,
        { orderId, reason: 'order_failed' },
      )

      // (d) Update order status and permanently link the refund transaction.
      //     refundWalletTransactionId being set is the durable marker that
      //     this order has been refunded — never cleared, never overwritten.
      return updateOrderStatusTx(tx, orderId, {
        status: 'failed',
        adminNote: data.adminNote,
        providerReference: data.providerReference,
        processedBy: adminId,
        refundWalletTransactionId: refundTx.id,
      })
    })
  }
}

export const orderService = new OrderService()
