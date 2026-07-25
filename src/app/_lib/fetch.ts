import { cookies } from 'next/headers'
import { getAppUrl } from '@/lib/site'

const BASE_URL = getAppUrl()

/**
 * Fetch wrapper for use in server components.
 * Reads access_token from the cookie store and forwards it as a Bearer token
 * so internal API routes go through the same auth middleware path as a browser.
 * Only callable from server components and server actions.
 */
export async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  })
}
