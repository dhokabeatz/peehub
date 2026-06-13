import { Prisma } from '@/lib/db'
import { getAdminPayments } from '@/repositories/payment.repository'
import type { TransactionStatus } from '@prisma/client'
import type { AdminPaymentListItem } from '@/types/payment'

export class AdminPaymentService {
  async listPayments(filter?: {
    status?: TransactionStatus
    provider?: 'paystack' | 'manual'
  }): Promise<AdminPaymentListItem[]> {
    const payments = await getAdminPayments(filter)
    return payments.map((payment) => this.serializePayment(payment))
  }

  private serializePayment(payment: {
    id: string
    userId: string
    walletId: string
    amount: Prisma.Decimal | string | number
    provider: string
    providerReference: string | null
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    user: {
      id: string
      fullName: string
      email: string | null
      phone: string | null
    }
  }): AdminPaymentListItem {
    return {
      id: payment.id,
      userId: payment.userId,
      walletId: payment.walletId,
      reference: payment.providerReference,
      amount: String(payment.amount),
      provider: payment.provider,
      status: payment.status,
      createdAt:
        payment.createdAt instanceof Date ? payment.createdAt.toISOString() : payment.createdAt,
      updatedAt:
        payment.updatedAt instanceof Date ? payment.updatedAt.toISOString() : payment.updatedAt,
      user: payment.user,
    }
  }
}

export const adminPaymentService = new AdminPaymentService()
