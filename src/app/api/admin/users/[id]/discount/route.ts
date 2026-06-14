import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { userDiscountService } from '@/services/user-discount.service'
import {
  AdminUserDiscountNotFoundError,
  InvalidDiscountValueError,
  InvalidDiscountWindowError,
} from '@/lib/errors/discount.errors'
import { AdminUserNotFoundError } from '@/lib/errors/user.errors'

const paramsSchema = z.object({
  id: z.string().uuid('User id must be a valid UUID'),
})

const discountTypeSchema = z.enum(['percentage', 'fixed'])

const putDiscountSchema = z.object({
  type: discountTypeSchema,
  value: z.number().positive('Discount value must be greater than 0'),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
})

const patchDiscountSchema = z
  .object({
    isActive: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (data) =>
      data.isActive !== undefined ||
      data.startsAt !== undefined ||
      data.endsAt !== undefined,
    {
      message: 'At least one field must be provided',
      path: [],
    },
  )

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

  try {
    const result = await userDiscountService.adminGetUserDiscount(parsedParams.data.id)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AdminUserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    console.error('[GET /api/admin/users/:id/discount]', err)
    return NextResponse.json({ error: 'Failed to load discount' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

  const parsed = putDiscountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const discount = await userDiscountService.adminReplaceUserDiscount(
      parsedParams.data.id,
      {
        ...parsed.data,
        startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
        endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      },
      adminId,
    )

    return NextResponse.json({ discount }, { status: 201 })
  } catch (err) {
    if (err instanceof AdminUserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err instanceof InvalidDiscountValueError || err instanceof InvalidDiscountWindowError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error('[PUT /api/admin/users/:id/discount]', err)
    return NextResponse.json({ error: 'Failed to replace discount' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

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

  const parsed = patchDiscountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const discount = await userDiscountService.adminUpdateUserDiscount(parsedParams.data.id, {
      isActive: parsed.data.isActive,
      startsAt:
        parsed.data.startsAt !== undefined
          ? parsed.data.startsAt
            ? new Date(parsed.data.startsAt)
            : null
          : undefined,
      endsAt:
        parsed.data.endsAt !== undefined
          ? parsed.data.endsAt
            ? new Date(parsed.data.endsAt)
            : null
          : undefined,
    })

    return NextResponse.json({ discount })
  } catch (err) {
    if (err instanceof AdminUserNotFoundError || err instanceof AdminUserDiscountNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err instanceof InvalidDiscountWindowError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error('[PATCH /api/admin/users/:id/discount]', err)
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 })
  }
}
