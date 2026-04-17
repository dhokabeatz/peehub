// wallet.service.ts — wallet balance reads, funding initiation, and debit-on-order.
// Uses SELECT FOR UPDATE inside $transaction() to prevent double-spend.
// No Next.js imports — framework-free and unit-testable.

// TODO: Phase 3
// import { db } from '@/lib/db'
// import { generateReference } from '@/lib/utils/reference'
// import type { FundWalletInput } from '@/types/wallet'

export class WalletService {
  async getBalance(_userId: string) {
    // TODO: Phase 3
    // 1. Query wallet row by userId
    // 2. Return { balance, currency: 'GHS' }
    throw new Error('Not implemented')
  }

  async fundWallet(_input: unknown) {
    // TODO: Phase 6 (Payment Integration)
    // 1. Generate unique reference
    // 2. Call paymentProvider.initiatePayment()
    // 3. Create pending WalletTransaction row
    // 4. Return { checkoutUrl }
    throw new Error('Not implemented')
  }

  async creditWallet(_reference: string) {
    // TODO: Phase 6
    // Called from payment webhook handler after verifying payment.
    // 1. Find pending WalletTransaction by reference (idempotency guard via UNIQUE constraint)
    // 2. $transaction(): SELECT FOR UPDATE wallet, credit balance, mark tx completed
    throw new Error('Not implemented')
  }

  async debitWallet(_userId: string, _amount: number, _description: string) {
    // TODO: Phase 4
    // Called by OrderService before placing an order.
    // 1. $transaction(): SELECT FOR UPDATE wallet, check balance, debit, create tx
    // 2. Return walletTransaction.id (linked to Order)
    throw new Error('Not implemented')
  }
}

export const walletService = new WalletService()
