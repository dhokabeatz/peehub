import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authService } from '@/services/auth.service'
import { setAuthCookies } from '@/lib/auth/cookies'

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: NextRequest) {
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
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
