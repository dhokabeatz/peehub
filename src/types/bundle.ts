export interface BundleNetworkSummary {
  id: string
  name: string
  code: string
  isActive: boolean
}

export interface BundleSummary {
  id: string
  name: string
  dataSizeMb: number
  validityDays: number
  price: string
  networkId: string
  isActive: boolean
}

export interface AdminBundle extends BundleSummary {
  createdAt: string
  updatedAt: string
  network: BundleNetworkSummary
  orderCount: number
  usedInOrders: boolean
}
