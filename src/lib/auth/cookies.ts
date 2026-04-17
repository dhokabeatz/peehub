import { type NextResponse } from 'next/server'

const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true'

// access_token — short-lived, readable on every route
export const ACCESS_COOKIE = 'access_token'
// refresh_token — long-lived, scoped to /api/auth only
export const REFRESH_COOKIE = 'refresh_token'

interface CookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
  path: string
  maxAge: number
}

function accessCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  }
}

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'strict',
    path: '/api/auth', // scoped — not sent on non-auth requests
    maxAge: 60 * 60 * 24 * 30, // 30 days
  }
}

export function setAuthCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions())
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions())
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, '', { ...accessCookieOptions(), maxAge: 0 })
  res.cookies.set(REFRESH_COOKIE, '', { ...refreshCookieOptions(), maxAge: 0 })
}
