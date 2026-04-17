// Shared wallet types used across services and API responses.

export type WalletTransactionType = 'credit' | 'debit'
export type WalletTransactionStatus = 'pending' | 'completed' | 'failed'

export interface WalletBalance {
  id: string
  userId: string
  balance: number  // in pesewas (Ghana cedis × 100)
  updatedAt: Date
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: WalletTransactionType
  amount: number
  status: WalletTransactionStatus
  reference: string
  description: string | null
  createdAt: Date
}

export interface FundWalletInput {
  userId: string
  amount: number  // in pesewas
  callbackUrl: string
}
