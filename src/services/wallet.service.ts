import { Decimal } from '@prisma/client/runtime/library'
import { db } from '@/lib/db'
import { getWalletByUserId, creditWalletTx } from '@/repositories/wallet.repository'
import {
  createPaymentTransaction,
  getPaymentByReference,
  lockAndGetPaymentTx,
  updatePaymentStatusTx,
} from '@/repositories/payment.repository'
import { generateReference } from '@/lib/utils/reference'
import { WalletNotFoundError } from '@/lib/errors/order.errors'
import { PaymentNotFoundError, PaymentAlreadyProcessedError } from '@/lib/errors/payment.errors'

// No Next.js imports — framework-free and unit-testable.

export class WalletService {
  async getBalance(userId: string) {
    const wallet = await getWalletByUserId(userId)
    if (!wallet) return null
    return {
      balance: wallet.balance, // Prisma Decimal — serialises to string in JSON
      currency: 'GHS',
    }
  }

  async fundWallet(userId: string, input: { amount: number }) {
    const wallet = await getWalletByUserId(userId)
    if (!wallet) throw new WalletNotFoundError()

    const amount = new Decimal(input.amount)
    const reference = generateReference('PAY')

    const payment = await createPaymentTransaction({
      userId,
      walletId: wallet.id,
      amount,
      provider: 'manual',
      reference,
    })

    return {
      reference: payment.providerReference,
      amount: payment.amount,
      currency: 'GHS',
      status: payment.status,
      provider: payment.provider,
    }
  }

  async confirmFunding(reference: string) {
    // Pre-check: fast-fail for non-pending payments before acquiring locks.
    // The real guard happens inside the transaction — this is just an optimisation.
    const payment = await getPaymentByReference(reference)
    if (!payment) throw new PaymentNotFoundError()
    if (payment.status !== 'pending') throw new PaymentAlreadyProcessedError(payment.status)

    // Generate the wallet transaction reference outside the transaction.
    // WTX-... is a separate ledger reference; PAY-... stays on the payment record.
    // They are linked via metadata so the credit can always be traced back to its payment.
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

    // Return the updated record after the transaction commits.
    return getPaymentByReference(reference)
  }
}

export const walletService = new WalletService()
