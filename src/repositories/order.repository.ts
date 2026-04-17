import { db } from '@/lib/db'

// All DB access for Orders goes through this file.

export async function createOrder(_data: {
  userId: string
  recipientPhone: string
  networkCode: string
  bundleCode: string
  bundleSize: string
  amountPaid: number
  walletTransactionId: string
  providerReference: string | null
}) {
  // TODO: Phase 4
  void db
  throw new Error('Not implemented')
}

export async function getOrdersByUserId(_userId: string) {
  // TODO: Phase 4
  throw new Error('Not implemented')
}

export async function getOrderById(_orderId: string) {
  // TODO: Phase 4
  throw new Error('Not implemented')
}

export async function updateOrderStatus(_orderId: string, _status: string) {
  // TODO: Phase 5 (Admin)
  throw new Error('Not implemented')
}
