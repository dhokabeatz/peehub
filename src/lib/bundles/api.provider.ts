import type { IBundleProvider, FulfillBundleInput, FulfillBundleResult } from './provider'

// Stub for future third-party bundle API integration.
// Set BUNDLE_PROVIDER=api + BUNDLE_API_BASE_URL + BUNDLE_API_KEY to activate.

export class ApiBundleProvider implements IBundleProvider {
  async fulfill(_input: FulfillBundleInput): Promise<FulfillBundleResult> {
    // TODO: Bundle API integration
    // 1. POST to BUNDLE_API_BASE_URL with auth header BUNDLE_API_KEY
    // 2. Parse providerReference from response
    // 3. Return { success, providerReference, message }
    throw new Error('API bundle provider not yet implemented')
  }
}

export const apiBundleProvider = new ApiBundleProvider()
