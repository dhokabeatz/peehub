import { cookies } from 'next/headers'

// Resolution order:
// 1. NEXT_PUBLIC_APP_URL — explicit override (set in Vercel env vars or .env.local)
// 2. VERCEL_URL          — auto-injected by Vercel per deployment (runtime, no protocol prefix)
// 3. localhost:3000       — local dev fallback
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) return process.env.NEXT_PUBLIC_APP_URL.trim()
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

const BASE_URL = getBaseUrl()

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
