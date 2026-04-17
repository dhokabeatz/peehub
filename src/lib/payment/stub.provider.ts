import type { IPaymentProvider, InitiatePaymentInput, InitiatePaymentResult, VerifyPaymentResult } from './provider'

// MVP stub — simulates a successful payment without hitting any external API.
// Used in development and until a real payment provider is integrated.
// Set PAYMENT_PROVIDER=hubtel or PAYMENT_PROVIDER=paystack to replace.

export class StubPaymentProvider implements IPaymentProvider {
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      checkoutUrl: `/dev/payment-stub?ref=${input.reference}&amount=${input.amount}`,
      providerReference: `stub_${input.reference}`,
    }
  }

  async verifyPayment(providerReference: string): Promise<VerifyPaymentResult> {
    // Stub always reports success — replace with real API call when integrating.
    return {
      success: true,
      amount: 0, // stub doesn't track amount; real provider returns this
      reference: providerReference.replace('stub_', ''),
    }
  }
}

export const stubPaymentProvider = new StubPaymentProvider()
