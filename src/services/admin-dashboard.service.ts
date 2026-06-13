import { Prisma } from '@/lib/db'
import { getAdminUserMetrics } from '@/repositories/user.repository'
import { getAdminOrderMetrics } from '@/repositories/order.repository'
import { getAdminPaymentMetrics } from '@/repositories/payment.repository'

export interface AdminDashboardMetrics {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  completedOrders: number
  failedOrders: number
  cancelledOrders: number
  totalCompletedOrderValue: string
  totalWalletFundingValue: string
  pendingPaymentCount: number
}

export class AdminDashboardService {
  async getMetrics(): Promise<AdminDashboardMetrics> {
    const [userMetrics, orderMetrics, paymentMetrics] = await Promise.all([
      getAdminUserMetrics(),
      getAdminOrderMetrics(),
      getAdminPaymentMetrics(),
    ])

    return {
      totalUsers: userMetrics.totalUsers,
      activeUsers: userMetrics.activeUsers,
      suspendedUsers: userMetrics.suspendedUsers,
      totalOrders: orderMetrics.totalOrders,
      pendingOrders: orderMetrics.pending,
      processingOrders: orderMetrics.processing,
      completedOrders: orderMetrics.completed,
      failedOrders: orderMetrics.failed,
      cancelledOrders: orderMetrics.cancelled,
      totalCompletedOrderValue: this.serializeDecimal(orderMetrics.totalCompletedOrderValue),
      totalWalletFundingValue: this.serializeDecimal(paymentMetrics.totalWalletFundingValue),
      pendingPaymentCount: paymentMetrics.pendingPaymentCount,
    }
  }

  private serializeDecimal(value: Prisma.Decimal | string | number | null | undefined) {
    return value == null ? '0' : String(value)
  }
}

export const adminDashboardService = new AdminDashboardService()
