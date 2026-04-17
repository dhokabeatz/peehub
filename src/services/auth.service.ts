// auth.service.ts — orchestrates login, registration, token issuance, refresh, logout.
// Depends on IAuthProvider (never a concrete class) and token.ts.
// No Next.js imports — framework-free and unit-testable.

// TODO: Phase 1
// import { localAuthProvider } from '@/lib/auth/local.provider'
// import { signAccessToken } from '@/lib/auth/token'
// import { db } from '@/lib/db'
// import type { CreateUserInput, AuthUser } from '@/lib/auth/provider'

export class AuthService {
  async login(_identifier: string, _password: string) {
    // TODO: Phase 1
    // 1. Call authProvider.validateCredentials()
    // 2. Sign access token + issue refresh token (store bcrypt hash in DB)
    // 3. Return { user, accessToken, refreshToken }
    throw new Error('Not implemented')
  }

  async register(_data: unknown) {
    // TODO: Phase 1
    // 1. Call authProvider.createUser() — creates user + wallet in one transaction
    // 2. Sign access token + issue refresh token
    // 3. Return { user, accessToken, refreshToken }
    throw new Error('Not implemented')
  }

  async refresh(_token: string) {
    // TODO: Phase 1
    // 1. Find refresh token row in DB (not expired, not revoked)
    // 2. Verify bcrypt hash matches
    // 3. Rotate: revoke old token, issue new pair
    // 4. Return { accessToken, refreshToken }
    throw new Error('Not implemented')
  }

  async logout(_refreshToken: string) {
    // TODO: Phase 1
    // 1. Find and revoke the refresh token row
    throw new Error('Not implemented')
  }
}

export const authService = new AuthService()
