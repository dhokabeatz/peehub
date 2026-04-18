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
