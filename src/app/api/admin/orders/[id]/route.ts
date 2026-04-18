import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { orderService } from '@/services/order.service'
import { OrderNotFoundError, InvalidStatusTransitionError, AlreadyRefundedError } from '@/lib/errors/admin.errors'

const paramsSchema = z.object({
  id: z.string().uuid('Order id must be a valid UUID'),
})

const updateOrderSchema = z.object({
  status: z.enum(['processing', 'completed', 'failed', 'cancelled']),
  adminNote: z.string().min(1).max(500).optional(),
  providerReference: z.string().min(1).max(100).optional(),
})

// GET /api/admin/orders/[id] — full order detail including user info and wallet tx
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

  const order = await orderService.adminGetOrder(parsedParams.data.id)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  return NextResponse.json({ order })
}

// PATCH /api/admin/orders/[id] — update status, adminNote, providerReference
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

  const parsed = updateOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const order = await orderService.adminUpdateStatus(parsedParams.data.id, parsed.data, adminId)
    return NextResponse.json({ order })
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err instanceof InvalidStatusTransitionError) {
      return NextResponse.json(
        { error: err.message, from: err.from, to: err.to },
        { status: 422 },
      )
    }
    if (err instanceof AlreadyRefundedError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    console.error('[PATCH /api/admin/orders/:id]', err)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
