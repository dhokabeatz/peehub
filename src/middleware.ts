import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/token'

// Edge middleware — runs before every matched request.
// Reads access_token cookie or Authorization Bearer header.
// On success: injects x-user-id + x-user-role headers for downstream handlers.
// On failure: returns 401 for API routes; redirects to /login for page routes.

const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
]

const PUBLIC_PAGE_ROUTES = [
  '/login',
  '/register',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Pass through public routes without auth check
  if (PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }
  if (PUBLIC_PAGE_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Extract token: cookie takes priority, Bearer header as fallback (API clients)
  const cookieToken = req.cookies.get('access_token')?.value
  const bearerToken = req.headers.get('authorization')?.replace('Bearer ', '')
  const token = cookieToken ?? bearerToken

  if (!token) {
    return unauthorizedOrRedirect(req)
  }

  try {
    const payload = await verifyAccessToken(token)

    // Inject identity headers — route handlers read these instead of decoding JWT
    const headers = new Headers(req.headers)
    headers.set('x-user-id', payload.sub)
    headers.set('x-user-role', payload.role)

    return NextResponse.next({ request: { headers } })
  } catch {
    return unauthorizedOrRedirect(req)
  }
}

function unauthorizedOrRedirect(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    // Match all routes except _next/static, _next/image, favicon, and public assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
