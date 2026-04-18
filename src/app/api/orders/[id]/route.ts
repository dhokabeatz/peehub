import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services/order.service'

// GET /api/orders/[id] — get a single order
// Non-admins receive 404 if the order belongs to another user (no existence leak)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = req.headers.get('x-user-id')
  const userRole = req.headers.get('x-user-role') ?? 'retail'
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const order = await orderService.getOrderById(id, userId, userRole)
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  return NextResponse.json({ order })
}
