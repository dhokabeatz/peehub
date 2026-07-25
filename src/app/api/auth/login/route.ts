import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authService } from '@/services/auth.service'
import { setAuthCookies } from '@/lib/auth/cookies'
import { consumeRateLimit, getRequestIp } from '@/lib/security/rate-limit'
import {
  getDatabaseReadinessCode,
  isDatabaseReadinessError,
} from '@/lib/errors/database.errors'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: NextRequest) {
  const limiter = consumeRateLimit({
    bucket: 'auth-login',
    key: `ip:${getRequestIp(req)}`,
    limit: 10,
    windowMs: 60_000,
  })
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limiter.retryAfterSeconds) },
      },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const result = await authService.login(parsed.data.identifier, parsed.data.password)

    if (!result) {
      // Deliberately vague — do not reveal whether the account exists
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const res = NextResponse.json({ user: result.user })
    setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken })
    return res
  } catch (error) {
    if (isDatabaseReadinessError(error)) {
      console.error(
        JSON.stringify({
          code: getDatabaseReadinessCode(error),
          route: 'auth.login',
          message: 'Authentication blocked by database readiness failure',
        }),
      )

      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 },
      )
    }

    console.error(
      JSON.stringify({
        code: 'AUTH_LOGIN_UNEXPECTED_ERROR',
        route: 'auth.login',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    )

    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
