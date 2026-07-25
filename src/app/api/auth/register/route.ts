import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authService } from '@/services/auth.service'
import { setAuthCookies } from '@/lib/auth/cookies'
import { consumeRateLimit, getRequestIp } from '@/lib/security/rate-limit'
import {
  getDatabaseReadinessCode,
  isDatabaseReadinessError,
} from '@/lib/errors/database.errors'

const registerSchema = z
  .object({
    fullName: z.string().min(2).max(100),
    email: z.string().email().optional(),
    phone: z.string().min(10).max(15).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((d) => d.email || d.phone, {
    message: 'At least one of email or phone is required',
    path: ['email'],
  })

export async function POST(req: NextRequest) {
  const limiter = consumeRateLimit({
    bucket: 'auth-register',
    key: `ip:${getRequestIp(req)}`,
    limit: 5,
    windowMs: 60_000,
  })
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
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

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const result = await authService.register(parsed.data)
    const res = NextResponse.json({ user: result.user }, { status: 201 })
    setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken })
    return res
  } catch (err) {
    if (isDatabaseReadinessError(err)) {
      console.error(
        JSON.stringify({
          code: getDatabaseReadinessCode(err),
          route: 'auth.register',
          message: 'Registration blocked by database readiness failure',
        }),
      )

      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 },
      )
    }

    const message = err instanceof Error ? err.message : 'Registration failed'
    if (message.toLowerCase().includes('unique') || message.toLowerCase().includes('already')) {
      return NextResponse.json({ error: 'Email or phone already registered' }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
