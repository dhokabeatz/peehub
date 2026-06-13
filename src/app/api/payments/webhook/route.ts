import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/payments/paystack'
import { walletService } from '@/services/wallet.service'
import {
  PaymentAlreadyProcessedError,
  PaystackVerificationError,
} from '@/lib/errors/payment.errors'

// POST /api/payments/webhook
// Paystack delivers payment events here asynchronously.
// This is the PRIMARY confirmation path — the browser callback is UX-only.
//
// Security:
//   - x-paystack-signature is verified before any processing
//   - Raw body is used for HMAC — JSON.parse happens only after verification
//   - Returns 200 on all handled paths to prevent Paystack retries
//   - Errors are logged but do not surface details to Paystack
//
// Idempotency:
//   - confirmFunding uses SELECT FOR UPDATE — safe if both callback + webhook fire
//   - PaymentAlreadyProcessedError is caught and treated as success

// Tell Next.js not to parse the body — we need the raw bytes for HMAC verification.
export const runtime = 'nodejs'

interface PaystackChargeEvent {
  event: string
  data: {
    reference: string
    status: string
    amount: number
    currency: string
  }
}

export async function POST(req: NextRequest) {
  // ── Read raw body before any parsing ─────────────────────────────────────────
  const rawBody = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  if (!verifyWebhookSignature(rawBody, signature)) {
    // Return 401 on invalid signature — this is not a legitimate Paystack request.
    // Paystack will NOT retry on 4xx — this is intentional.
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ── Parse after verification ──────────────────────────────────────────────────
  let event: PaystackChargeEvent
  try {
    event = JSON.parse(rawBody) as PaystackChargeEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Only handle charge.success ────────────────────────────────────────────────
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  const reference = event.data?.reference
  if (!reference) {
    console.warn('[POST /api/payments/webhook] charge.success with no reference')
    return NextResponse.json({ received: true })
  }

  // ── Verify and credit ─────────────────────────────────────────────────────────
  try {
    await walletService.verifyAndConfirmPaystackPayment(reference)
  } catch (err) {
    if (err instanceof PaymentAlreadyProcessedError) {
      // Callback beat us to it — wallet already credited. This is normal.
      return NextResponse.json({ received: true })
    }

    if (err instanceof PaystackVerificationError) {
      // Validation failed (amount mismatch, wrong currency, etc.) — log for investigation.
      // Return 200 so Paystack does not retry; this is a data anomaly, not a transient error.
      console.error('[POST /api/payments/webhook] Verification failed:', err.message, { reference })
      return NextResponse.json({ received: true })
    }

    // Unexpected error — log it. Still return 200 to avoid Paystack retries flooding logs.
    console.error('[POST /api/payments/webhook] Unexpected error for reference', reference, err)
  }

  return NextResponse.json({ received: true })
}
