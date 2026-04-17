// IBundleProvider — the single interface both manual and API providers implement.
// bundle.service.ts depends only on this interface.
// Swapping providers = changing BUNDLE_PROVIDER env var + wiring the concrete class.

export interface FulfillBundleInput {
  orderId: string
  recipientPhone: string
  networkCode: string  // e.g. 'MTN', 'TELECEL', 'AIRTELTIGO'
  bundleCode: string
  bundleSize: string   // human-readable label e.g. '1GB'
}

export interface FulfillBundleResult {
  success: boolean
  providerReference: string | null  // external reference from third-party API, null for manual
  message?: string
}

export interface IBundleProvider {
  // Attempts to fulfill a bundle order. Returns result with providerReference.
  fulfill(input: FulfillBundleInput): Promise<FulfillBundleResult>
}
