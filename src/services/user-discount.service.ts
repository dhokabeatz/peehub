import { Prisma, db } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'
import { getAdminUserById } from '@/repositories/user.repository'
import {
  createUserDiscountTx,
  deactivateActiveUserDiscountsTx,
  getAdminUserDiscountByUserId,
  getApplicableUserDiscount,
  getUserDiscountHistoryByUserId,
  updateUserDiscount,
} from '@/repositories/user-discount.repository'
import {
  AdminUserDiscountNotFoundError,
  DiscountedAmountInvalidError,
  InvalidDiscountValueError,
  InvalidDiscountWindowError,
} from '@/lib/errors/discount.errors'
import { AdminUserNotFoundError } from '@/lib/errors/user.errors'
import type { DiscountType } from '@/types/discount'

export function getUserDiscountStatus(
  discount: {
    isActive: boolean
    startsAt: Date | string | null
    endsAt: Date | string | null
  },
  now = new Date(),
) {
  if (!discount.isActive) return 'inactive' as const

  const startsAt = discount.startsAt ? new Date(discount.startsAt) : null
  const endsAt = discount.endsAt ? new Date(discount.endsAt) : null

  if (startsAt && startsAt > now) return 'scheduled' as const
  if (endsAt && endsAt <= now) return 'expired' as const
  return 'active' as const
}

export function serializeUserDiscountSummary(discount: {
  id: string
  type: DiscountType
  value: Prisma.Decimal | string | number
  isActive: boolean
  startsAt: Date | string | null
  endsAt: Date | string | null
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string
}) {
  return {
    id: discount.id,
    type: discount.type,
    value: String(discount.value),
    isActive: discount.isActive,
    startsAt:
      discount.startsAt instanceof Date
        ? discount.startsAt.toISOString()
        : discount.startsAt,
    endsAt:
      discount.endsAt instanceof Date
        ? discount.endsAt.toISOString()
        : discount.endsAt,
    createdBy: discount.createdBy,
    createdAt:
      discount.createdAt instanceof Date
        ? discount.createdAt.toISOString()
        : discount.createdAt,
    updatedAt:
      discount.updatedAt instanceof Date
        ? discount.updatedAt.toISOString()
        : discount.updatedAt,
    status: getUserDiscountStatus(discount),
  }
}

export function calculateDiscountedAmount(input: {
  baseAmount: Decimal
  discount: {
    id: string
    type: DiscountType
    value: Prisma.Decimal | string | number
  } | null
}) {
  const baseAmount = new Decimal(input.baseAmount)

  if (!input.discount) {
    return {
      baseAmount,
      discountAmount: new Decimal(0),
      finalAmount: baseAmount,
      appliedDiscountId: null,
      appliedDiscountType: null,
      appliedDiscountValue: null,
    }
  }

  const value = new Decimal(input.discount.value)
  let discountAmount = new Decimal(0)

  if (input.discount.type === 'percentage') {
    if (value.lte(0) || value.gte(100)) {
      throw new InvalidDiscountValueError('Percentage discount must be greater than 0 and less than 100')
    }
    discountAmount = baseAmount.mul(value).div(100)
  } else {
    if (value.lte(0)) {
      throw new InvalidDiscountValueError('Fixed discount must be greater than 0')
    }
    if (value.gte(baseAmount)) {
      throw new DiscountedAmountInvalidError()
    }
    discountAmount = value
  }

  const finalAmount = baseAmount.minus(discountAmount)
  if (finalAmount.lte(0)) {
    throw new DiscountedAmountInvalidError()
  }

  return {
    baseAmount,
    discountAmount,
    finalAmount,
    appliedDiscountId: input.discount.id,
    appliedDiscountType: input.discount.type,
    appliedDiscountValue: value,
  }
}

export class UserDiscountService {
  async getApplicableDiscountForUser(userId: string, at = new Date()) {
    return getApplicableUserDiscount(userId, at)
  }

  async adminGetUserDiscount(userId: string) {
    const user = await getAdminUserById(userId)
    if (!user) throw new AdminUserNotFoundError()

    const [discount, history] = await Promise.all([
      getAdminUserDiscountByUserId(userId),
      getUserDiscountHistoryByUserId(userId, 5),
    ])

    return {
      discount: discount ? serializeUserDiscountSummary(discount) : null,
      history: history.map((item) => serializeUserDiscountSummary(item)),
    }
  }

  async adminReplaceUserDiscount(
    userId: string,
    data: {
      type: DiscountType
      value: number
      isActive: boolean
      startsAt?: Date | null
      endsAt?: Date | null
    },
    adminId: string,
  ) {
    const user = await getAdminUserById(userId)
    if (!user) throw new AdminUserNotFoundError()

    this.validateDiscountInput(data)

    const discount = await db.$transaction(async (tx) => {
      await deactivateActiveUserDiscountsTx(tx, userId)
      return createUserDiscountTx(tx, {
        userId,
        type: data.type,
        value: data.value,
        isActive: data.isActive,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        createdBy: adminId,
      })
    })

    return serializeUserDiscountSummary(discount)
  }

  async adminUpdateUserDiscount(
    userId: string,
    data: {
      isActive?: boolean
      startsAt?: Date | null
      endsAt?: Date | null
    },
  ) {
    const user = await getAdminUserById(userId)
    if (!user) throw new AdminUserNotFoundError()

    const current = await getAdminUserDiscountByUserId(userId)
    if (!current) throw new AdminUserDiscountNotFoundError()

    const startsAt = data.startsAt !== undefined ? data.startsAt : current.startsAt
    const endsAt = data.endsAt !== undefined ? data.endsAt : current.endsAt
    this.validateDiscountWindow(startsAt ?? null, endsAt ?? null)

    if (data.isActive === true) {
      await db.$transaction(async (tx) => {
        await deactivateActiveUserDiscountsTx(tx, userId, current.id)
        await tx.userDiscount.update({
          where: { id: current.id },
          data: {
            isActive: true,
            ...(data.startsAt !== undefined ? { startsAt: data.startsAt } : {}),
            ...(data.endsAt !== undefined ? { endsAt: data.endsAt } : {}),
          },
        })
      })

      const updated = await getAdminUserDiscountByUserId(userId)
      if (!updated) throw new AdminUserDiscountNotFoundError()
      return serializeUserDiscountSummary(updated)
    }

    const updated = await updateUserDiscount(current.id, data)
    return serializeUserDiscountSummary(updated)
  }

  private validateDiscountInput(data: {
    type: DiscountType
    value: number
    startsAt?: Date | null
    endsAt?: Date | null
  }) {
    this.validateDiscountWindow(data.startsAt ?? null, data.endsAt ?? null)

    if (data.type === 'percentage') {
      if (!(data.value > 0 && data.value < 100)) {
        throw new InvalidDiscountValueError('Percentage discount must be greater than 0 and less than 100')
      }
      return
    }

    if (!(data.value > 0)) {
      throw new InvalidDiscountValueError('Fixed discount must be greater than 0')
    }
  }

  private validateDiscountWindow(startsAt: Date | null, endsAt: Date | null) {
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new InvalidDiscountWindowError()
    }
  }
}

export const userDiscountService = new UserDiscountService()
