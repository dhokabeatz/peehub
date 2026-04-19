/**
 * Paystack API client — server-side only.
 * Never import this from client components or expose PAYSTACK_SECRET_KEY to the browser.
 */
import { createHmac } from 'crypto'

const PAYSTACK_BASE = 'https://api.paystack.co'

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set')
  return key
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaystackInitResult {
  authorization_url: string
  access_code: string
  reference: string
}

export interface PaystackVerifyData {
  status: string    // 'success' | 'failed' | 'abandoned' | ...
  reference: string
  amount: number    // in pesewas (GHS × 100)
  currency: string  // 'GHS'
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function initializeTransaction(params: {
  email: string
  amountGhs: number
  reference: string
  callbackUrl: string
  metadata: {
    userId: string
    walletId: string
    purpose: string
  }
}): Promise<PaystackInitResult> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email:        params.email,
      amount:       Math.round(params.amountGhs * 100), // GHS → pesewas
      currency:     'GHS',
      reference:    params.reference,
      callback_url: params.callbackUrl,
      metadata:     params.metadata,
    }),
  })

  const json = await res.json() as {
    status: boolean
    message: string
    data: PaystackInitResult
  }

  if (!res.ok || !json.status) {
    throw new Error(`Paystack initialization failed: ${json.message ?? res.statusText}`)
  }

  return json.data
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyData> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey()}` } },
  )

  const json = await res.json() as {
    status: boolean
    message: string
    data: PaystackVerifyData
  }

  if (!res.ok || !json.status) {
    throw new Error(`Paystack verification failed: ${json.message ?? res.statusText}`)
  }

  return json.data
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

/**
 * Verifies that the x-paystack-signature header matches the HMAC-SHA512 of
 * the raw request body signed with PAYSTACK_SECRET_KEY.
 * Must be called BEFORE parsing the body as JSON.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const hash = createHmac('sha512', secretKey()).update(rawBody).digest('hex')
  return hash === signature
}
