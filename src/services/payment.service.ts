// payment.service.ts — payment initiation and webhook verification.
// Thin orchestrator: delegates to IPaymentProvider, updates WalletService.
// No Next.js imports — framework-free and unit-testable.

// TODO: Phase 6
// import { stubPaymentProvider } from '@/lib/payment/stub.provider'
// import { walletService } from './wallet.service'
// import { generateReference } from '@/lib/utils/reference'

export class PaymentService {
  async initiatePayment(_userId: string, _amount: number, _callbackUrl: string) {
    // TODO: Phase 6
    // 1. generateReference()
    // 2. paymentProvider.initiatePayment()
    // 3. Create pending WalletTransaction with reference
    // 4. Return { checkoutUrl }
    throw new Error('Not implemented')
  }

  async handleWebhook(_rawBody: string, _signature: string) {
    // TODO: Phase 6
    // 1. Verify webhook signature using PAYMENT_WEBHOOK_SECRET
    // 2. Extract reference from payload
    // 3. walletService.creditWallet(reference) — UNIQUE constraint prevents double-credit
    throw new Error('Not implemented')
  }
}

export const paymentService = new PaymentService()
