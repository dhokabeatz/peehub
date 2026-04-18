import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { walletService } from '@/services/wallet.service'
import { PaymentNotFoundError, PaymentAlreadyProcessedError } from '@/lib/errors/payment.errors'

const confirmSchema = z.object({
  reference: z.string().min(1, 'reference is required'),
})

// POST /api/admin/wallet/confirm — manually confirm a pending payment (MVP path)
export async function POST(req: NextRequest) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = confirmSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const payment = await walletService.confirmFunding(parsed.data.reference)
    return NextResponse.json({ payment })
  } catch (err) {
    // 404 — reference does not exist
    if (err instanceof PaymentNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }

    if (err instanceof PaymentAlreadyProcessedError) {
      // 200 — already confirmed; safe to call again (idempotent)
      if (err.status === 'success') {
        return NextResponse.json(
          { message: 'Payment already confirmed', paymentStatus: 'success' },
          { status: 200 },
        )
      }

      // 422 — payment failed; cannot be confirmed, manual intervention required
      return NextResponse.json(
        { error: err.message, paymentStatus: err.status },
        { status: 422 },
      )
    }

    console.error('[POST /api/admin/wallet/confirm]', err)
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
