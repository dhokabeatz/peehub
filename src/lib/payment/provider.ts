// IPaymentProvider — interface for wallet funding payment providers.
// payment.service.ts depends only on this interface.
// Swapping providers = changing PAYMENT_PROVIDER env var + wiring the concrete class.

export interface InitiatePaymentInput {
  userId: string
  amount: number       // in pesewas (Ghana cedis × 100)
  currency: string     // 'GHS'
  reference: string    // unique — used for idempotency and webhook matching
  callbackUrl: string  // where the provider POSTs the webhook
}

export interface InitiatePaymentResult {
  checkoutUrl: string  // redirect user here to complete payment
  providerReference: string
}

export interface VerifyPaymentResult {
  success: boolean
  amount: number
  reference: string
}

export interface IPaymentProvider {
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>
  verifyPayment(providerReference: string): Promise<VerifyPaymentResult>
}
