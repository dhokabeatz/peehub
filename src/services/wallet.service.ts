import { Decimal } from '@prisma/client/runtime/library'
import { db } from '@/lib/db'
import { getWalletByUserId, creditWalletTx } from '@/repositories/wallet.repository'
import { findUserById } from '@/repositories/user.repository'
import {
  createPaymentTransaction,
  getPaymentByReference,
  lockAndGetPaymentTx,
  updatePaymentStatusTx,
} from '@/repositories/payment.repository'
import { initializeTransaction, verifyTransaction } from '@/lib/payments/paystack'
import { generateReference } from '@/lib/utils/reference'
import { WalletNotFoundError } from '@/lib/errors/order.errors'
import {
  PaymentNotFoundError,
  PaymentAlreadyProcessedError,
  PaystackVerificationError,
} from '@/lib/errors/payment.errors'

// No Next.js imports — framework-free and unit-testable.

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) return process.env.NEXT_PUBLIC_APP_URL.trim()
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export class WalletService {
  async getBalance(userId: string) {
    const wallet = await getWalletByUserId(userId)
    if (!wallet) return null
    return {
      balance: wallet.balance.toString(),
      currency: 'GHS',
    }
  }

  async fundWallet(userId: string, input: { amount: number }, origin?: string) {
    const wallet = await getWalletByUserId(userId)
    if (!wallet) throw new WalletNotFoundError()

    const amount   = new Decimal(input.amount)
    const provider = process.env.PAYMENT_PROVIDER ?? 'manual'
    const reference = generateReference('PAY')

    // ── Create the PaymentTransaction record first ─────────────────────────────
    // This is our source of truth regardless of provider. If Paystack init fails
    // after this, the pending record stays in the DB but is harmless — it will
    // never be confirmed because Paystack has no record of it.
    const payment = await createPaymentTransaction({
      userId,
      walletId: wallet.id,
      amount,
      provider,
      reference,
    })

    if (provider === 'paystack') {
      // Fetch user email — required by Paystack. Users who registered with
      // phone only get a synthetic placeholder accepted by Paystack test mode.
      const user = await findUserById(userId)
      const email = user?.email ?? `${userId.slice(0, 8)}@peehub.wallet`

      const paystackResult = await initializeTransaction({
        email,
        amountGhs: input.amount,
        reference,
        callbackUrl: `${origin ?? getAppUrl()}/api/payments/callback`,
        metadata: {
          userId,
          walletId: wallet.id,
          purpose: 'wallet_funding',
        },
      })

      return {
        reference:         payment.providerReference,
        amount:            payment.amount.toString(),
        currency:          'GHS',
        status:            payment.status,
        provider:          payment.provider,
        authorization_url: paystackResult.authorization_url,
      }
    }

    // ── Manual / stub provider ────────────────────────────────────────────────
    return {
      reference:  payment.providerReference,
      amount:     payment.amount.toString(),
      currency:   'GHS',
      status:     payment.status,
      provider:   payment.provider,
    }
  }

  /**
   * Verifies a Paystack payment server-side and credits the wallet if valid.
   * Called by both the callback redirect and the webhook handler.
   * Safe to call concurrently — confirmFunding uses SELECT FOR UPDATE.
   *
   * Safeguards:
   *   1. Validates status === 'success'
   *   2. Validates reference matches exactly
   *   3. Validates currency === 'GHS'
   *   4. Validates amount matches our stored record (pesewas comparison)
   *   5. Delegates to confirmFunding which is idempotent
   */
  async verifyAndConfirmPaystackPayment(reference: string): Promise<void> {
    // ── Load our stored payment record ────────────────────────────────────────
    const payment = await getPaymentByReference(reference)
    if (!payment) throw new PaymentNotFoundError()

    // ── Verify with Paystack ──────────────────────────────────────────────────
    const paystackData = await verifyTransaction(reference)

    // ── Validate all fields before crediting ─────────────────────────────────
    if (paystackData.status !== 'success') {
      throw new PaystackVerificationError(
        `Payment not successful — Paystack status: ${paystackData.status}`,
      )
    }

    if (paystackData.reference !== reference) {
      throw new PaystackVerificationError(
        `Reference mismatch — expected ${reference}, got ${paystackData.reference}`,
      )
    }

    if (paystackData.currency !== 'GHS') {
      throw new PaystackVerificationError(
        `Currency mismatch — expected GHS, got ${paystackData.currency}`,
      )
    }

    // Paystack amount is in pesewas; our DB stores GHS.
    const expectedPesewas = Math.round(Number(payment.amount) * 100)
    if (paystackData.amount !== expectedPesewas) {
      throw new PaystackVerificationError(
        `Amount mismatch — expected ${expectedPesewas} pesewas, got ${paystackData.amount}`,
      )
    }

    // ── All checks passed — credit the wallet ─────────────────────────────────
    await this.confirmFunding(reference)
  }

  async confirmFunding(reference: string) {
    // Pre-check: fast-fail for non-pending payments before acquiring locks.
    // The real guard happens inside the transaction — this is just an optimisation.
    const payment = await getPaymentByReference(reference)
    if (!payment) throw new PaymentNotFoundError()
    if (payment.status !== 'pending') throw new PaymentAlreadyProcessedError(payment.status)

    // Generate the wallet transaction reference outside the transaction.
    // WTX-... is a separate ledger reference; PAY-... stays on the payment record.
    const walletTxRef = generateReference('WTX')

    await db.$transaction(async (tx) => {
      // Re-acquire lock inside the transaction. Concurrent confirms block here
      // until the first one commits, then re-read status and abort.
      const locked = await lockAndGetPaymentTx(tx, reference)
      if (!locked) throw new PaymentNotFoundError()
      if (locked.status !== 'pending') throw new PaymentAlreadyProcessedError(locked.status)

      await creditWalletTx(
        tx,
        locked.walletId,
        locked.userId,
        new Decimal(locked.amount),
        `Wallet top-up`,
        walletTxRef,
        { paymentReference: reference },
      )

      await updatePaymentStatusTx(tx, locked.id, 'success')
    })

    return getPaymentByReference(reference)
  }
}

export const walletService = new WalletService()
