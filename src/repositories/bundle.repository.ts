import { db } from '@/lib/db'

// All DB access for Networks and Bundles goes through this file.

export async function getAllNetworks() {
  // TODO: Phase 2
  void db
  throw new Error('Not implemented')
}

export async function getBundlesByNetworkId(_networkId: string) {
  // TODO: Phase 2
  throw new Error('Not implemented')
}

export async function getBundleById(_bundleId: string) {
  // TODO: Phase 2 / Phase 4 (needed by OrderService)
  throw new Error('Not implemented')
}

export async function createBundle(_data: {
  networkId: string
  code: string
  label: string
  priceInPesewas: number
  isActive?: boolean
}) {
  // TODO: Phase 2 (Admin)
  throw new Error('Not implemented')
}

export async function updateBundle(_bundleId: string, _data: Partial<{
  label: string
  priceInPesewas: number
  isActive: boolean
}>) {
  // TODO: Phase 2 (Admin)
  throw new Error('Not implemented')
}
