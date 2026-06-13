import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { userService } from '@/services/user.service'

// GET /api/admin/users — list all registered users
export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  const users = await userService.adminListUsers()
  return NextResponse.json({ users })
}
