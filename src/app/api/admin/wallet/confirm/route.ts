import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { walletService } from '@/services/wallet.service'
import {
  PaymentNotFoundError,
  PaymentAlreadyProcessedError,
  ManualPaymentConfirmationNotAllowedError,
} from '@/lib/errors/payment.errors'
import { consumeRateLimit, getRequestIp } from '@/lib/security/rate-limit'

const confirmSchema = z.object({
  reference: z.string().min(1, 'reference is required'),
})

// POST /api/admin/wallet/confirm — manually confirm a pending payment (MVP path)
export async function POST(req: NextRequest) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  const userId = req.headers.get('x-user-id')
  const limiter = consumeRateLimit({
    bucket: 'admin-wallet-confirm',
    key: userId ? `user:${userId}` : `ip:${getRequestIp(req)}`,
    limit: 10,
    windowMs: 60_000,
  })
  if (!limiter.allowed) {
    return NextResponse.json(
      { error: 'Too many confirmation attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limiter.retryAfterSeconds) },
      },
    )
  }

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
    const payment = await walletService.confirmFunding(parsed.data.reference, {
      allowedProviders: ['manual', 'stub'],
    })
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
    if (err instanceof ManualPaymentConfirmationNotAllowedError) {
      return NextResponse.json(
        { error: err.message, provider: err.provider },
        { status: 409 },
      )
    }

    console.error('[POST /api/admin/wallet/confirm]', err)
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}
