import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { orderService } from '@/services/order.service'
import {
  InsufficientBalanceError,
  BundleNotFoundError,
  NetworkMismatchError,
  WalletNotFoundError,
  UnknownNetworkError,
} from '@/lib/errors/order.errors'

const createOrderSchema = z.object({
  bundleId: z.string().uuid('bundleId must be a valid UUID'),
  recipientPhone: z.string().min(10).max(15),
})

// POST /api/orders — place a new order
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  // userRole is available for future reseller discount logic (Phase 7)
  // const userRole = req.headers.get('x-user-role') ?? 'retail'
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const order = await orderService.placeOrder(userId, parsed.data)
    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: err.message }, { status: 402 })
    }
    if (err instanceof BundleNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err instanceof NetworkMismatchError) {
      return NextResponse.json(
        { error: err.message, detected: err.detected, expected: err.expected },
        { status: 422 },
      )
    }
    if (err instanceof UnknownNetworkError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    if (err instanceof WalletNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
    console.error('[POST /api/orders]', err)
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}

// GET /api/orders — list the authenticated user's orders
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await orderService.getUserOrders(userId)
  return NextResponse.json({ orders })
}
