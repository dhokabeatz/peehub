import { db, type PrismaTransactionClient } from '@/lib/db'
import type { AuthUser } from '@/lib/auth/provider'

// DBUser extends AuthUser with passwordHash — only used inside the auth layer.
// Nothing outside src/lib/auth or src/services should import DBUser.
export type DBUser = AuthUser & { passwordHash: string | null }

// Columns fetched for auth operations (includes hash)
const AUTH_SELECT = {
  id: true,
  email: true,
  phone: true,
  passwordHash: true,
  fullName: true,
  role: true,
  isActive: true,
} as const

// Columns fetched for identity-only operations (no hash)
const PUBLIC_SELECT = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  isActive: true,
} as const

const ADMIN_USER_LIST_SELECT = {
  ...PUBLIC_SELECT,
  createdAt: true,
  wallet: {
    select: {
      balance: true,
    },
  },
  _count: {
    select: {
      orders: true,
    },
  },
} as const

const ADMIN_USER_DETAIL_SELECT = {
  ...PUBLIC_SELECT,
  createdAt: true,
  updatedAt: true,
  wallet: {
    select: {
      id: true,
      balance: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  _count: {
    select: {
      orders: true,
    },
  },
  orders: {
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      recipientPhone: true,
      amount: true,
      status: true,
      createdAt: true,
      bundle: {
        select: {
          name: true,
          dataSizeMb: true,
          validityDays: true,
        },
      },
      network: {
        select: {
          name: true,
          code: true,
        },
      },
    },
  },
  walletTransactions: {
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      reference: true,
      type: true,
      amount: true,
      balanceBefore: true,
      balanceAfter: true,
      status: true,
      description: true,
      createdAt: true,
    },
  },
} as const

// ─── Auth lookups (return DBUser with passwordHash) ───────────────────────────

export async function findUserByEmail(email: string): Promise<DBUser | null> {
  const user = await db.user.findUnique({ where: { email }, select: AUTH_SELECT })
  return user ?? null
}

export async function findUserByPhone(phone: string): Promise<DBUser | null> {
  const user = await db.user.findUnique({ where: { phone }, select: AUTH_SELECT })
  return user ?? null
}

// ─── Public lookup (no passwordHash) ─────────────────────────────────────────

export async function findUserById(id: string): Promise<AuthUser | null> {
  const user = await db.user.findUnique({ where: { id }, select: PUBLIC_SELECT })
  return user ?? null
}

// ─── Admin reads ─────────────────────────────────────────────────────────────

export async function getAdminUsers() {
  return db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: ADMIN_USER_LIST_SELECT,
  })
}

export async function getAdminUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: ADMIN_USER_DETAIL_SELECT,
  })
}

export async function getAdminUserMetrics() {
  const [totalUsers, activeUsers, suspendedUsers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isActive: true } }),
    db.user.count({ where: { isActive: false } }),
  ])

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
  }
}

// ─── Admin writes ────────────────────────────────────────────────────────────

export async function updateUserActiveStatus(id: string, isActive: boolean) {
  return db.user.update({
    where: { id },
    data: { isActive },
    select: ADMIN_USER_DETAIL_SELECT,
  })
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createUserWithWallet(data: {
  fullName: string
  email?: string
  phone?: string
  passwordHash: string
}): Promise<AuthUser> {
  // User + Wallet created atomically — wallet must always exist when user does.
  return db.$transaction(async (tx: PrismaTransactionClient) => {
    const user = await tx.user.create({
      data: {
        fullName: data.fullName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        passwordHash: data.passwordHash,
      },
      select: PUBLIC_SELECT,
    })

    await tx.wallet.create({
      data: { userId: user.id }, // balance defaults to 0.00 via schema
    })

    return user
  })
}
