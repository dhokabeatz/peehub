import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { walletService } from '@/services/wallet.service'
import { WalletNotFoundError } from '@/lib/errors/order.errors'

const fundWalletSchema = z.object({
  amount: z
    .number()
    .positive('amount must be positive')
    .min(1, 'minimum top-up is GHS 1')
    .max(10000, 'maximum top-up is GHS 10,000'),
})

// POST /api/wallet/fund — initiate a wallet top-up
export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = fundWalletSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 422 },
    )
  }

  try {
    const result = await walletService.fundWallet(userId, parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    if (err instanceof WalletNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
    console.error('[POST /api/wallet/fund]', err)
    return NextResponse.json({ error: 'Failed to initiate wallet top-up' }, { status: 500 })
  }
}
