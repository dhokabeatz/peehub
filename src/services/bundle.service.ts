import {
  getAllNetworks,
  getNetworkById,
  getNetworkByCode,
  getBundlesByNetworkCode,
  getBundleById,
  getAdminBundles,
  getAdminBundleById,
  createBundle as dbCreateBundle,
  updateBundle as dbUpdateBundle,
} from '@/repositories/bundle.repository'
import { Prisma } from '@/lib/db'
import {
  AdminBundleNotFoundError,
  AdminNetworkNotFoundError,
  BundleNetworkImmutableError,
  DuplicateBundleError,
  UsedBundleCoreAttributesLockedError,
} from '@/lib/errors/bundle.errors'

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

  async adminListBundles() {
    const bundles = await getAdminBundles()
    return bundles.map((bundle) => this.serializeAdminBundle(bundle))
  }

  async adminGetBundleById(id: string) {
    const bundle = await getAdminBundleById(id)
    if (!bundle) return null
    return this.serializeAdminBundle(bundle)
  }

  async createBundle(data: {
    networkId: string
    name: string
    dataSizeMb: number
    validityDays: number
    price: number
  }) {
    const network = await getNetworkById(data.networkId)
    if (!network) throw new AdminNetworkNotFoundError()

    try {
      const bundle = await dbCreateBundle(data)
      return this.serializeBundle(bundle)
    } catch (err) {
      if (this.isBundleUniqueConstraint(err)) throw new DuplicateBundleError()
      throw err
    }
  }

  async updateBundle(
    id: string,
    data: Partial<{
      dataSizeMb: number
      validityDays: number
      price: number
      isActive: boolean
      networkId: string
    }>,
  ) {
    const bundle = await getAdminBundleById(id)
    if (!bundle) throw new AdminBundleNotFoundError()

    if (data.networkId && data.networkId !== bundle.networkId) {
      throw new BundleNetworkImmutableError()
    }

    const usedInOrders = bundle._count.orders > 0
    const lockedFields = [
      data.dataSizeMb !== undefined && data.dataSizeMb !== bundle.dataSizeMb ? 'dataSizeMb' : null,
      data.validityDays !== undefined && data.validityDays !== bundle.validityDays ? 'validityDays' : null,
    ].filter((field): field is string => field !== null)

    if (usedInOrders && lockedFields.length > 0) {
      throw new UsedBundleCoreAttributesLockedError(lockedFields)
    }

    const nextData: Partial<{
      dataSizeMb: number
      validityDays: number
      price: number
      isActive: boolean
    }> = {}

    if (data.dataSizeMb !== undefined) nextData.dataSizeMb = data.dataSizeMb
    if (data.validityDays !== undefined) nextData.validityDays = data.validityDays
    if (data.price !== undefined) nextData.price = data.price
    if (data.isActive !== undefined) nextData.isActive = data.isActive

    if (Object.keys(nextData).length === 0) {
      return this.serializeBundle(bundle)
    }

    const updated = await dbUpdateBundle(id, nextData)
    return this.serializeBundle(updated)
  }

  async deactivateBundle(id: string) {
    const bundle = await getAdminBundleById(id)
    if (!bundle) throw new AdminBundleNotFoundError()

    const updated = await dbUpdateBundle(id, { isActive: false })
    return this.serializeBundle(updated)
  }

  private serializeBundle(bundle: {
    id: string
    name: string
    dataSizeMb: number
    validityDays: number
    price: Prisma.Decimal | string | number
    networkId: string
    isActive: boolean
  }) {
    return {
      ...bundle,
      price: String(bundle.price),
    }
  }

  private serializeAdminBundle(bundle: {
    id: string
    name: string
    dataSizeMb: number
    validityDays: number
    price: Prisma.Decimal | string | number
    networkId: string
    isActive: boolean
    createdAt: Date | string
    updatedAt: Date | string
    network: {
      id: string
      name: string
      code: string
      isActive: boolean
    }
    _count: {
      orders: number
    }
  }) {
    return {
      ...this.serializeBundle(bundle),
      createdAt: bundle.createdAt instanceof Date ? bundle.createdAt.toISOString() : bundle.createdAt,
      updatedAt: bundle.updatedAt instanceof Date ? bundle.updatedAt.toISOString() : bundle.updatedAt,
      network: bundle.network,
      orderCount: bundle._count.orders,
      usedInOrders: bundle._count.orders > 0,
    }
  }

  private isBundleUniqueConstraint(err: unknown) {
    return (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    )
  }
}

export const bundleService = new BundleService()
