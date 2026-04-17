import type { IBundleProvider, FulfillBundleInput, FulfillBundleResult } from './provider'

// MVP provider — no external API call.
// fulfill() is a no-op: order is created with status=pending,
// and admin manually processes it via the admin dashboard.

export class ManualBundleProvider implements IBundleProvider {
  async fulfill(_input: FulfillBundleInput): Promise<FulfillBundleResult> {
    // Manual fulfillment: signal success so the order is saved,
    // but providerReference is null (no external system involved).
    return {
      success: true,
      providerReference: null,
      message: 'Order queued for manual fulfillment',
    }
  }
}

export const manualBundleProvider = new ManualBundleProvider()
