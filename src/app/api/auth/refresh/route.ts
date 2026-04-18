import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from '@/lib/auth/cookies'

export async function POST(req: NextRequest) {
  // Browser clients send the cookie automatically.
  // API clients must include { refreshToken: "..." } in the request body.
  const cookieToken = req.cookies.get(REFRESH_COOKIE)?.value

  let bodyToken: string | undefined
  try {
    const body = await req.json() as { refreshToken?: string }
    bodyToken = body.refreshToken
  } catch {
    // No body is fine — browser clients rely on the cookie
  }

  const rawToken = cookieToken ?? bodyToken

  if (!rawToken) {
    return NextResponse.json({ error: 'No refresh token provided' }, { status: 401 })
  }

  const result = await authService.refresh(rawToken)

  if (!result) {
    // Token invalid, expired, or revoked — clear cookies and force re-login
    const res = NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 })
    clearAuthCookies(res)
    return res
  }

  const res = NextResponse.json({ user: result.user })
  setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken })
  return res
}
