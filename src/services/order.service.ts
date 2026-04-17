// order.service.ts — order placement and admin status updates.
// Coordinates WalletService (debit) + BundleProvider (fulfill) in sequence.
// No Next.js imports — framework-free and unit-testable.

// TODO: Phase 4
// import { walletService } from './wallet.service'
// import { bundleService } from './bundle.service'
// import { db } from '@/lib/db'
// import type { CreateOrderInput } from '@/types/order'

export class OrderService {
  async placeOrder(_userId: string, _input: unknown) {
    // TODO: Phase 4
    // 1. Fetch bundle details + price from DB
    // 2. walletService.debitWallet() — fails fast if insufficient balance
    // 3. bundleProvider.fulfill() — manual provider returns success immediately
    // 4. Create Order row linked to walletTransactionId
    // 5. Return created order
    throw new Error('Not implemented')
  }

  async getUserOrders(_userId: string) {
    // TODO: Phase 4
    // Query orders by userId, most recent first
    throw new Error('Not implemented')
  }

  async getOrderById(_orderId: string, _requesterId: string, _requesterRole: string) {
    // TODO: Phase 4
    // Return order if owner or admin
    throw new Error('Not implemented')
  }

  async updateOrderStatus(_orderId: string, _status: string, _adminId: string) {
    // TODO: Phase 5 (Admin)
    // Admin only. If status=failed → trigger refund via walletService.creditWallet()
    throw new Error('Not implemented')
  }
}

export const orderService = new OrderService()
