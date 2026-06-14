import { db, type PrismaTransactionClient } from '@/lib/db'

const USER_DISCOUNT_SELECT = {
  id: true,
  userId: true,
  type: true,
  value: true,
  isActive: true,
  startsAt: true,
  endsAt: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function getApplicableUserDiscount(userId: string, at: Date) {
  return db.userDiscount.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: at } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: at } }] }],
    },
    orderBy: { createdAt: 'desc' },
    select: USER_DISCOUNT_SELECT,
  })
}

export async function getAdminUserDiscountByUserId(userId: string) {
  return db.userDiscount.findFirst({
    where: { userId },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    select: USER_DISCOUNT_SELECT,
  })
}

export async function getUserDiscountHistoryByUserId(userId: string, take = 5) {
  return db.userDiscount.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
    select: USER_DISCOUNT_SELECT,
  })
}

export async function deactivateActiveUserDiscountsTx(
  tx: PrismaTransactionClient,
  userId: string,
  excludeId?: string,
) {
  return tx.userDiscount.updateMany({
    where: {
      userId,
      isActive: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    data: { isActive: false },
  })
}

export async function createUserDiscountTx(
  tx: PrismaTransactionClient,
  data: {
    userId: string
    type: 'percentage' | 'fixed'
    value: string | number
    isActive: boolean
    startsAt?: Date | null
    endsAt?: Date | null
    createdBy: string
  },
) {
  return tx.userDiscount.create({
    data: {
      userId: data.userId,
      type: data.type,
      value: data.value,
      isActive: data.isActive,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
      createdBy: data.createdBy,
    },
    select: USER_DISCOUNT_SELECT,
  })
}

export async function updateUserDiscount(
  id: string,
  data: {
    isActive?: boolean
    startsAt?: Date | null
    endsAt?: Date | null
  },
) {
  return db.userDiscount.update({
    where: { id },
    data,
    select: USER_DISCOUNT_SELECT,
  })
}
