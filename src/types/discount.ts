export type DiscountType = 'percentage' | 'fixed'

export type UserDiscountStatus = 'active' | 'scheduled' | 'expired' | 'inactive'

export interface UserDiscountSummary {
  id: string
  type: DiscountType
  value: string
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  status: UserDiscountStatus
}
