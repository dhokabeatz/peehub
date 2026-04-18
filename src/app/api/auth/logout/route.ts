import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'
import { clearAuthCookies, REFRESH_COOKIE } from '@/lib/auth/cookies'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value

  if (refreshToken) {
    // Best-effort — revoke the refresh token in DB.
    // Even if this fails, cookies are still cleared below.
    await authService.logout(refreshToken).catch(() => {})
  }

  const res = NextResponse.json({ success: true })
  clearAuthCookies(res)
  return res
}
