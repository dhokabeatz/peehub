import { db } from '@/lib/db'
import type { AuthUser } from '@/lib/auth/provider'

// All DB access for Users goes through this file.
// Services and providers import from here — never from db.ts directly.

export async function findUserByEmail(_email: string): Promise<AuthUser | null> {
  // TODO: Phase 1
  throw new Error('Not implemented')
}

export async function findUserByPhone(_phone: string): Promise<AuthUser | null> {
  // TODO: Phase 1
  throw new Error('Not implemented')
}

export async function findUserById(_id: string): Promise<AuthUser | null> {
  // TODO: Phase 1
  throw new Error('Not implemented')
}

export async function createUserWithWallet(_data: {
  fullName: string
  email?: string
  phone?: string
  passwordHash: string
}): Promise<AuthUser> {
  // TODO: Phase 1
  // Must use db.$transaction() to create User + Wallet atomically
  void db // suppress unused import warning until implemented
  throw new Error('Not implemented')
}
