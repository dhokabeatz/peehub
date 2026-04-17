import type { IAuthProvider, AuthUser, CreateUserInput } from './provider'

// Implements IAuthProvider using the local database + bcrypt.
// No Passport imports — this layer is framework-free and unit-testable in isolation.
// Phase 1 will fill in the implementations.

export class LocalAuthProvider implements IAuthProvider {
  async validateCredentials(_identifier: string, _password: string): Promise<AuthUser | null> {
    // TODO: Phase 1
    // 1. Detect identifier type (email vs phone) via detectIdentifierType()
    // 2. Query users table by email or phone
    // 3. Compare password with bcrypt.compare()
    // 4. Return null if user not found, inactive, or password mismatch
    throw new Error('Not implemented')
  }

  async createUser(_data: CreateUserInput): Promise<AuthUser> {
    // TODO: Phase 1
    // 1. Validate at least one of email/phone is provided
    // 2. Hash password with bcrypt (cost factor 12)
    // 3. Insert user row
    // 4. Auto-create wallet in the same transaction
    throw new Error('Not implemented')
  }
}

export const localAuthProvider = new LocalAuthProvider()
