import { cookies } from 'next/headers'
import { verifyAccessToken } from '@/lib/auth/token'
import type { SessionUser } from '@/types/user'

/**
 * Reads the access_token cookie and returns the decoded session.
 * Returns null if the cookie is missing or the token is invalid/expired.
 * Only callable from server components, server actions, and route handlers.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return null

  try {
    const payload = await verifyAccessToken(token)
    return { id: payload.sub, role: payload.role }
  } catch {
    return null
  }
}
