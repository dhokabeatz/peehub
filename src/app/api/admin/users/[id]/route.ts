import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { userService } from '@/services/user.service'
import {
  AdminUserNotFoundError,
  SelfUserDeactivationError,
} from '@/lib/errors/user.errors'

const paramsSchema = z.object({
  id: z.string().uuid('User id must be a valid UUID'),
})

const updateUserSchema = z.object({
  isActive: z.boolean(),
})

// GET /api/admin/users/[id] — full user detail for admin use
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  const parsedParams = paramsSchema.safeParse(params)
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsedParams.error.issues },
      { status: 422 },
    )
  }

  const user = await userService.adminGetUserById(parsedParams.data.id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({ user })
}

// PATCH /api/admin/users/[id] — activate or suspend a user
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  const adminId = req.headers.get('x-user-id')
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsedParams = paramsSchema.safeParse(params)
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsedParams.error.issues },
      { status: 422 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const user = await userService.adminUpdateUser(parsedParams.data.id, parsed.data, adminId)
    return NextResponse.json({ user })
  } catch (err) {
    if (err instanceof AdminUserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err instanceof SelfUserDeactivationError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    console.error('[PATCH /api/admin/users/:id]', err)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
