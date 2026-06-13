export type AdminPaymentStatus = 'pending' | 'success' | 'failed'
export type AdminPaymentProvider = 'paystack' | 'manual'

export interface AdminPaymentListItem {
  id: string
  userId: string
  walletId: string
  reference: string | null
  amount: string
  provider: string
  status: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    fullName: string
    email: string | null
    phone: string | null
  }
}
