import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { orderService } from '@/services/order.service'

const listQuerySchema = z.object({
  status: z
    .enum(['pending', 'processing', 'completed', 'failed', 'cancelled'])
    .optional(),
})

// GET /api/admin/orders — list all orders, optionally filtered by status
export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  const { searchParams } = new URL(req.url)
  const parsed = listQuerySchema.safeParse({ status: searchParams.get('status') ?? undefined })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const orders = await orderService.adminListOrders(parsed.data)
  return NextResponse.json({ orders })
}
