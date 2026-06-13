import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { adminPaymentService } from '@/services/admin-payment.service'

const paymentQuerySchema = z.object({
  status: z.enum(['pending', 'success', 'failed']).optional(),
  provider: z.enum(['paystack', 'manual']).optional(),
})

// GET /api/admin/payments — list payment transactions for admin review
export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  const parsed = paymentQuerySchema.safeParse({
    status: req.nextUrl.searchParams.get('status') ?? undefined,
    provider: req.nextUrl.searchParams.get('provider') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  const payments = await adminPaymentService.listPayments(parsed.data)

  return NextResponse.json({ payments })
}
