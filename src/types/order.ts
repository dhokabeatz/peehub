export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface OrderBundle {
  id: string
  name: string
  dataSizeMb: number
  validityDays: number
}

export interface OrderNetwork {
  id: string
  name: string
  code: string
}

export interface Order {
  id: string
  userId: string
  recipientPhone: string
  amount: string
  status: OrderStatus
  providerReference: string | null
  adminNote: string | null
  walletTransactionId: string | null
  refundWalletTransactionId: string | null
  createdAt: string
  updatedAt: string
  bundle: OrderBundle
  network: OrderNetwork
}

export interface WalletTransactionSummary {
  id: string
  reference: string
  amount: string
  status: string
}

export interface AdminOrder extends Order {
  processedBy: string | null
  user: {
    id: string
    fullName: string
    email: string | null
    phone: string | null
  }
  walletTransaction: WalletTransactionSummary | null
  refundWalletTransaction: WalletTransactionSummary | null
}
