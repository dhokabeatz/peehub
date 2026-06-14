import type { UserDiscountSummary } from '@/types/discount'

export type UserRole = 'retail' | 'agent' | 'admin'

export interface SessionUser {
  id: string
  role: string
}

export interface UserProfile {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  role: UserRole
  isActive: boolean
}

export interface AdminUserListItem extends UserProfile {
  walletBalance: string | null
  orderCount: number
  createdAt: string
  discount: UserDiscountSummary | null
}

export interface AdminUserWalletTransaction {
  id: string
  reference: string
  type: 'credit' | 'debit'
  amount: string
  balanceBefore: string
  balanceAfter: string
  status: string
  description: string | null
  createdAt: string
}

export interface AdminUserOrderSummary {
  id: string
  recipientPhone: string
  amount: string
  status: string
  createdAt: string
  bundle: {
    name: string
    dataSizeMb: number
    validityDays: number
  }
  network: {
    name: string
    code: string
  }
}

export interface AdminUserDetail extends UserProfile {
  createdAt: string
  updatedAt: string
  wallet: {
    id: string
    balance: string
    createdAt: string
    updatedAt: string
  } | null
  orderCount: number
  discount: UserDiscountSummary | null
  discountHistory: UserDiscountSummary[]
  recentOrders: AdminUserOrderSummary[]
  walletTransactions: AdminUserWalletTransaction[]
}
