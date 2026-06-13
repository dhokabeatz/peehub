import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { bundleService } from '@/services/bundle.service'
import {
  AdminBundleNotFoundError,
  BundleNetworkImmutableError,
  UsedBundleCoreAttributesLockedError,
} from '@/lib/errors/bundle.errors'

const paramsSchema = z.object({
  id: z.string().uuid('Bundle id must be a valid UUID'),
})

const updateBundleSchema = z
  .object({
    price: z.number().positive('price must be greater than 0').optional(),
    dataSizeMb: z.number().int().positive('dataSizeMb must be greater than 0').optional(),
    validityDays: z.number().int().positive('validityDays must be greater than 0').optional(),
    isActive: z.boolean().optional(),
    networkId: z.string().uuid('networkId must be a valid UUID').optional(),
  })
  .refine(
    (data) =>
      data.price !== undefined ||
      data.dataSizeMb !== undefined ||
      data.validityDays !== undefined ||
      data.isActive !== undefined ||
      data.networkId !== undefined,
    {
      message: 'At least one field must be provided',
      path: [],
    },
  )

// GET /api/admin/bundles/[id] — fetch a single bundle with admin detail
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

  const bundle = await bundleService.adminGetBundleById(parsedParams.data.id)
  if (!bundle) return NextResponse.json({ error: 'Bundle not found' }, { status: 404 })

  return NextResponse.json({ bundle })
}

// PATCH /api/admin/bundles/[id] — update mutable bundle fields
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

  const parsed = updateBundleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const bundle = await bundleService.updateBundle(parsedParams.data.id, parsed.data)
    return NextResponse.json({ bundle })
  } catch (err) {
    if (err instanceof AdminBundleNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err instanceof BundleNetworkImmutableError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    if (err instanceof UsedBundleCoreAttributesLockedError) {
      return NextResponse.json(
        { error: err.message, fields: err.fields },
        { status: 409 },
      )
    }
    console.error('[PATCH /api/admin/bundles/:id]', err)
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 })
  }
}
