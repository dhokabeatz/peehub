import {
  getAllNetworks,
  getNetworkByCode,
  getBundlesByNetworkCode,
  getBundleById,
  createBundle as dbCreateBundle,
  updateBundle as dbUpdateBundle,
} from '@/repositories/bundle.repository'

// No Next.js imports — framework-free and unit-testable.

export class BundleService {
  async getNetworks() {
    return getAllNetworks()
  }

  async getNetworkWithBundles(code: string) {
    const [network, bundles] = await Promise.all([
      getNetworkByCode(code),
      getBundlesByNetworkCode(code),
    ])
    if (!network) return null
    return { network, bundles }
  }

  async getBundleById(id: string) {
    return getBundleById(id)
  }

  async createBundle(data: {
    networkId: string
    name: string
    dataSizeMb: number
    validityDays: number
    price: number
  }) {
    return dbCreateBundle(data)
  }

  async updateBundle(
    id: string,
    data: Partial<{
      name: string
      dataSizeMb: number
      validityDays: number
      price: number
      isActive: boolean
    }>,
  ) {
    return dbUpdateBundle(id, data)
  }

  async deactivateBundle(id: string) {
    return dbUpdateBundle(id, { isActive: false })
  }
}

export const bundleService = new BundleService()
