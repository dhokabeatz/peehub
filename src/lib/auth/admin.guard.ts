import { NextRequest, NextResponse } from 'next/server'
import { ROLES } from '@/constants/roles'

/**
 * Returns a 403 response if the request is not from an admin, or null if access is allowed.
 * Usage: const forbidden = requireAdmin(req); if (forbidden) return forbidden;
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const role = req.headers.get('x-user-role')
  if (role !== ROLES.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}
