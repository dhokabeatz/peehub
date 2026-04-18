import { localAuthProvider } from '@/lib/auth/local.provider'
import { signAccessToken } from '@/lib/auth/token'
import {
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '@/lib/auth/refresh-token'
import { findUserById } from '@/repositories/user.repository'
import type { IAuthProvider, CreateUserInput } from '@/lib/auth/provider'

// Provider resolved at startup — swap AUTH_PROVIDER env var to switch implementations.
function resolveProvider(): IAuthProvider {
  const name = process.env.AUTH_PROVIDER ?? 'local'
  if (name === 'local') return localAuthProvider
  throw new Error(`Unknown AUTH_PROVIDER: "${name}"`)
}

const provider = resolveProvider()

export class AuthService {
  async login(identifier: string, password: string) {
    const user = await provider.validateCredentials(identifier, password)
    if (!user) return null

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, role: user.role }),
      createRefreshToken(user.id),
    ])

    return { user, accessToken, refreshToken }
  }

  async register(data: CreateUserInput) {
    const user = await provider.createUser(data)

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: user.id, role: user.role }),
      createRefreshToken(user.id),
    ])

    return { user, accessToken, refreshToken }
  }

  async refresh(rawRefreshToken: string) {
    const rotated = await rotateRefreshToken(rawRefreshToken)
    if (!rotated) return null

    const user = await findUserById(rotated.userId)
    if (!user || !user.isActive) return null

    const accessToken = await signAccessToken({ sub: user.id, role: user.role })

    return { user, accessToken, refreshToken: rotated.newRawToken }
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await revokeRefreshToken(rawRefreshToken)
  }
}

export const authService = new AuthService()
