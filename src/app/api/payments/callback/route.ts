import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/services/wallet.service'
import {
  PaymentAlreadyProcessedError,
  PaymentNotFoundError,
  PaystackVerificationError,
} from '@/lib/errors/payment.errors'

// This route is the UX redirect path only.
// Wallet crediting may already have been done by the webhook before the user
// lands here — that case is handled gracefully via PaymentAlreadyProcessedError.
//
// Webhook (/api/payments/webhook) is the primary confirmation path.
// This callback exists so the user is redirected to a meaningful page immediately
// after completing checkout rather than landing on Paystack's default thank-you page.

function appUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) return process.env.NEXT_PUBLIC_APP_URL.trim()
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

// GET /api/payments/callback?reference=PAY-xxx
// Paystack redirects the user's browser here after checkout completes.
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference')
  const base = appUrl()

  if (!reference) {
    return NextResponse.redirect(`${base}/wallet/fund?error=missing_reference`)
  }

  try {
    await walletService.verifyAndConfirmPaystackPayment(reference)
    return NextResponse.redirect(`${base}/wallet?funded=true`)
  } catch (err) {
    if (err instanceof PaymentAlreadyProcessedError) {
      // Webhook beat us to it — wallet is already credited. Redirect to success.
      return NextResponse.redirect(`${base}/wallet?funded=true`)
    }

    if (
      err instanceof PaystackVerificationError ||
      err instanceof PaymentNotFoundError
    ) {
      console.error('[GET /api/payments/callback]', err.message)
      return NextResponse.redirect(`${base}/wallet/fund?error=payment_failed`)
    }

    console.error('[GET /api/payments/callback] Unexpected error', err)
    return NextResponse.redirect(`${base}/wallet/fund?error=payment_failed`)
  }
}
