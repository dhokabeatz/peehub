import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { bundleService } from '@/services/bundle.service'
import {
  AdminNetworkNotFoundError,
  DuplicateBundleError,
} from '@/lib/errors/bundle.errors'

const createBundleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  networkId: z.string().uuid('networkId must be a valid UUID'),
  dataSizeMb: z.number().int().positive('dataSizeMb must be greater than 0'),
  validityDays: z.number().int().positive('validityDays must be greater than 0'),
  price: z.number().positive('price must be greater than 0'),
})

// GET /api/admin/bundles — list all bundles, including inactive ones
export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  const bundles = await bundleService.adminListBundles()
  return NextResponse.json({ bundles })
}

// POST /api/admin/bundles — create a bundle under a network
export async function POST(req: NextRequest) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createBundleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const bundle = await bundleService.createBundle(parsed.data)
    return NextResponse.json({ bundle }, { status: 201 })
  } catch (err) {
    if (err instanceof AdminNetworkNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err instanceof DuplicateBundleError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    console.error('[POST /api/admin/bundles]', err)
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 })
  }
}
