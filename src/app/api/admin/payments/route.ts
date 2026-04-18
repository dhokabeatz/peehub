import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin.guard'
import { db } from '@/lib/db'

// GET /api/admin/payments?status=pending — list payment transactions for admin review
export async function GET(req: NextRequest) {
  const forbidden = requireAdmin(req)
  if (forbidden) return forbidden

  const status = req.nextUrl.searchParams.get('status') ?? 'pending'

  const payments = await db.paymentTransaction.findMany({
    where: { status: status as 'pending' | 'success' | 'failed' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      providerReference: true,
      amount: true,
      provider: true,
      status: true,
      createdAt: true,
      user: {
        select: { fullName: true, email: true, phone: true },
      },
    },
  })

  return NextResponse.json({ payments })
}
