import { NextRequest, NextResponse } from 'next/server'
import { walletService } from '@/services/wallet.service'

// GET /api/wallet — get the authenticated user's wallet balance
export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wallet = await walletService.getBalance(userId)
  if (!wallet) return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })

  return NextResponse.json(wallet)
}
