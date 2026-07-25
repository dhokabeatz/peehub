import { Prisma } from '@/lib/db'

const CONNECTIVITY_ERROR_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017'])
const SCHEMA_ERROR_CODES = new Set(['P2021', 'P2022'])

export type DatabaseReadinessCode =
  | 'DB_UNREACHABLE'
  | 'DB_SCHEMA_NOT_READY'
  | 'DB_READINESS_UNKNOWN'

export function getDatabaseReadinessCode(error: unknown): DatabaseReadinessCode {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return 'DB_UNREACHABLE'
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (CONNECTIVITY_ERROR_CODES.has(error.code)) return 'DB_UNREACHABLE'
    if (SCHEMA_ERROR_CODES.has(error.code)) return 'DB_SCHEMA_NOT_READY'
  }

  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (
    message.includes('does not exist') ||
    message.includes('no such table') ||
    message.includes('relation') && message.includes('does not exist')
  ) {
    return 'DB_SCHEMA_NOT_READY'
  }

  if (
    message.includes('can\'t reach database server') ||
    message.includes('connection') && message.includes('timed out')
  ) {
    return 'DB_UNREACHABLE'
  }

  return 'DB_READINESS_UNKNOWN'
}

export function isDatabaseReadinessError(error: unknown) {
  return getDatabaseReadinessCode(error) !== 'DB_READINESS_UNKNOWN'
}
