// Shared order types used across services and API responses.

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'

export interface OrderSummary {
  id: string
  userId: string
  recipientPhone: string
  networkCode: string
  bundleCode: string
  bundleSize: string
  amountPaid: number   // in pesewas
  status: OrderStatus
  providerReference: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateOrderInput {
  recipientPhone: string
  bundleId: string
}
