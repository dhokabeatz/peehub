// bundle.service.ts — bundle and network catalog reads.
// Admin bundle management (create/update/deactivate) also lives here.
// No Next.js imports — framework-free and unit-testable.

// TODO: Phase 2
// import { db } from '@/lib/db'

export class BundleService {
  async getNetworks() {
    // TODO: Phase 2
    // Return all active networks ordered by name
    throw new Error('Not implemented')
  }

  async getBundlesByNetwork(_networkId: string) {
    // TODO: Phase 2
    // Return active bundles for a given network, ordered by price
    throw new Error('Not implemented')
  }

  async createBundle(_data: unknown) {
    // TODO: Phase 2 (Admin)
    throw new Error('Not implemented')
  }

  async updateBundle(_bundleId: string, _data: unknown) {
    // TODO: Phase 2 (Admin)
    throw new Error('Not implemented')
  }

  async deactivateBundle(_bundleId: string) {
    // TODO: Phase 2 (Admin)
    throw new Error('Not implemented')
  }
}

export const bundleService = new BundleService()
