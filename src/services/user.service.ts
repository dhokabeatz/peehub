import { Prisma } from '@/lib/db'
import {
  getAdminUsers,
  getAdminUserById,
  updateUserActiveStatus,
} from '@/repositories/user.repository'
import {
  AdminUserNotFoundError,
  SelfUserDeactivationError,
} from '@/lib/errors/user.errors'
import { serializeUserDiscountSummary } from '@/services/user-discount.service'

export class UserService {
  async adminListUsers() {
    const users = await getAdminUsers()
    return users.map((user) => this.serializeAdminUserListItem(user))
  }

  async adminGetUserById(id: string) {
    const user = await getAdminUserById(id)
    if (!user) return null
    return this.serializeAdminUserDetail(user)
  }

  async adminUpdateUser(
    id: string,
    data: { isActive: boolean },
    adminId: string,
  ) {
    const user = await getAdminUserById(id)
    if (!user) throw new AdminUserNotFoundError()

    if (adminId === id && data.isActive === false) {
      throw new SelfUserDeactivationError()
    }

    const updated = await updateUserActiveStatus(id, data.isActive)
    return this.serializeAdminUserDetail(updated)
  }

  private serializeAdminUserListItem(user: {
    id: string
    fullName: string
    email: string | null
    phone: string | null
    role: string
    isActive: boolean
    createdAt: Date | string
    wallet: { balance: Prisma.Decimal | string | number } | null
    _count: { orders: number }
    userDiscounts: Array<{
      id: string
      type: 'percentage' | 'fixed'
      value: Prisma.Decimal | string | number
      isActive: boolean
      startsAt: Date | string | null
      endsAt: Date | string | null
      createdBy: string
      createdAt: Date | string
      updatedAt: Date | string
    }>
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      walletBalance: user.wallet ? String(user.wallet.balance) : null,
      orderCount: user._count.orders,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      discount: user.userDiscounts[0] ? serializeUserDiscountSummary(user.userDiscounts[0]) : null,
    }
  }

  private serializeAdminUserDetail(user: {
    id: string
    fullName: string
    email: string | null
    phone: string | null
    role: string
    isActive: boolean
    createdAt: Date | string
    updatedAt: Date | string
    wallet: {
      id: string
      balance: Prisma.Decimal | string | number
      createdAt: Date | string
      updatedAt: Date | string
    } | null
    _count: { orders: number }
    userDiscounts: Array<{
      id: string
      type: 'percentage' | 'fixed'
      value: Prisma.Decimal | string | number
      isActive: boolean
      startsAt: Date | string | null
      endsAt: Date | string | null
      createdBy: string
      createdAt: Date | string
      updatedAt: Date | string
    }>
    orders: Array<{
      id: string
      recipientPhone: string
      amount: Prisma.Decimal | string | number
      status: string
      createdAt: Date | string
      bundle: {
        name: string
        dataSizeMb: number
        validityDays: number
      }
      network: {
        name: string
        code: string
      }
    }>
    walletTransactions: Array<{
      id: string
      reference: string
      type: 'credit' | 'debit'
      amount: Prisma.Decimal | string | number
      balanceBefore: Prisma.Decimal | string | number
      balanceAfter: Prisma.Decimal | string | number
      status: string
      description: string | null
      createdAt: Date | string
    }>
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
      wallet: user.wallet
        ? {
            id: user.wallet.id,
            balance: String(user.wallet.balance),
            createdAt:
              user.wallet.createdAt instanceof Date
                ? user.wallet.createdAt.toISOString()
                : user.wallet.createdAt,
            updatedAt:
              user.wallet.updatedAt instanceof Date
                ? user.wallet.updatedAt.toISOString()
                : user.wallet.updatedAt,
          }
        : null,
      orderCount: user._count.orders,
      discount: user.userDiscounts[0] ? serializeUserDiscountSummary(user.userDiscounts[0]) : null,
      discountHistory: user.userDiscounts.map((discount) => serializeUserDiscountSummary(discount)),
      recentOrders: user.orders.map((order) => ({
        id: order.id,
        recipientPhone: order.recipientPhone,
        amount: String(order.amount),
        status: order.status,
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        bundle: order.bundle,
        network: order.network,
      })),
      walletTransactions: user.walletTransactions.map((tx) => ({
        id: tx.id,
        reference: tx.reference,
        type: tx.type,
        amount: String(tx.amount),
        balanceBefore: String(tx.balanceBefore),
        balanceAfter: String(tx.balanceAfter),
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
      })),
    }
  }
}

export const userService = new UserService()
