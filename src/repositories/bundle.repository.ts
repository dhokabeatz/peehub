import { db } from '@/lib/db'

// ─── Select shapes ────────────────────────────────────────────────────────────

const NETWORK_SELECT = {
  id: true,
  name: true,
  code: true,
  prefixes: true,
  isActive: true,
} as const

const BUNDLE_SELECT = {
  id: true,
  name: true,
  dataSizeMb: true,
  validityDays: true,
  price: true,
  networkId: true,
  isActive: true,
} as const

const ADMIN_BUNDLE_SELECT = {
  ...BUNDLE_SELECT,
  createdAt: true,
  updatedAt: true,
  network: {
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
    },
  },
  _count: {
    select: {
      orders: true,
    },
  },
} as const

// ─── Network queries ──────────────────────────────────────────────────────────

export async function getAllNetworks() {
  return db.network.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: NETWORK_SELECT,
  })
}

export async function getNetworkByCode(code: string) {
  return db.network.findUnique({
    where: { code: code.toUpperCase() },
    select: NETWORK_SELECT,
  })
}

export async function getNetworkById(id: string) {
  return db.network.findUnique({
    where: { id },
    select: NETWORK_SELECT,
  })
}

// ─── Bundle queries ───────────────────────────────────────────────────────────

export async function getBundlesByNetworkId(networkId: string) {
  return db.bundle.findMany({
    where: { networkId, isActive: true },
    orderBy: { price: 'asc' },
    select: BUNDLE_SELECT,
  })
}

export async function getBundlesByNetworkCode(code: string) {
  return db.bundle.findMany({
    where: { network: { code: code.toUpperCase() }, isActive: true },
    orderBy: { price: 'asc' },
    select: BUNDLE_SELECT,
  })
}

export async function getBundleById(id: string) {
  return db.bundle.findUnique({
    where: { id },
    select: { ...BUNDLE_SELECT, network: { select: { name: true, code: true } } },
  })
}

export async function getAdminBundles() {
  return db.bundle.findMany({
    orderBy: [{ network: { name: 'asc' } }, { price: 'asc' }, { createdAt: 'desc' }],
    select: ADMIN_BUNDLE_SELECT,
  })
}

export async function getAdminBundleById(id: string) {
  return db.bundle.findUnique({
    where: { id },
    select: ADMIN_BUNDLE_SELECT,
  })
}

// ─── Admin writes ─────────────────────────────────────────────────────────────

export async function createBundle(data: {
  networkId: string
  name: string
  dataSizeMb: number
  validityDays: number
  price: number
}) {
  return db.bundle.create({ data, select: BUNDLE_SELECT })
}

export async function updateBundle(
  id: string,
  data: Partial<{
    name: string
    dataSizeMb: number
    validityDays: number
    price: number
    isActive: boolean
  }>,
) {
  return db.bundle.update({ where: { id }, data, select: BUNDLE_SELECT })
}
