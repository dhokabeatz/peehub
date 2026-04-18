import type { IAuthProvider, AuthUser, CreateUserInput } from './provider'
import { findUserByEmail, findUserByPhone, createUserWithWallet } from '@/repositories/user.repository'
import { hashPassword, verifyPassword } from './password'
import { detectIdentifierType, normalizePhone } from '@/lib/utils/phone'

// No Passport imports — this class is pure business logic, unit-testable in isolation.
// Passport strategies (src/lib/auth/passport/) call into this, not the other way around.

export class LocalAuthProvider implements IAuthProvider {
  async validateCredentials(identifier: string, password: string): Promise<AuthUser | null> {
    const type = detectIdentifierType(identifier)

    const dbUser =
      type === 'email'
        ? await findUserByEmail(identifier.toLowerCase().trim())
        : await findUserByPhone(normalizePhone(identifier) ?? identifier.trim())

    // Constant-time path: always call verifyPassword to prevent timing attacks,
    // even when user is not found (compare against a dummy hash).
    const hashToCompare = dbUser?.passwordHash ?? '$2b$12$invalidhashfortimingattackprevention'
    const valid = await verifyPassword(password, hashToCompare)

    if (!dbUser || !dbUser.isActive || !valid) return null

    // Strip passwordHash before returning — AuthUser never carries the hash.
    const { passwordHash: _hash, ...user } = dbUser
    return user
  }

  async createUser(data: CreateUserInput): Promise<AuthUser> {
    if (!data.email && !data.phone) {
      throw new Error('At least one of email or phone is required')
    }

    const passwordHash = await hashPassword(data.password)

    return createUserWithWallet({
      fullName: data.fullName.trim(),
      email: data.email ? data.email.toLowerCase().trim() : undefined,
      phone: data.phone ? (normalizePhone(data.phone) ?? data.phone.trim()) : undefined,
      passwordHash,
    })
  }
}

export const localAuthProvider = new LocalAuthProvider()
