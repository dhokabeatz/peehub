import { db } from '@/lib/db'
import { getDatabaseReadinessCode } from '@/lib/errors/database.errors'

const REQUIRED_TABLES = [
  'public.users',
  'public.wallets',
  'public.wallet_transactions',
  'public.payment_transactions',
  'public.networks',
  'public.bundles',
  'public.orders',
  'public.refresh_tokens',
  'public.password_reset_tokens',
  'public.user_discounts',
  'public._prisma_migrations',
] as const

export class ReadinessService {
  async check() {
    try {
      await db.$queryRawUnsafe('SELECT 1')

      const tableExpressions = REQUIRED_TABLES.map(
        (tableName, index) => `to_regclass('${tableName}')::text AS table_${index}`,
      ).join(', ')

      const rows = await db.$queryRawUnsafe<Array<Record<string, string | null>>>(
        `SELECT ${tableExpressions}`,
      )

      const row = rows[0] ?? {}
      const missingTables = REQUIRED_TABLES.filter((_, index) => !row[`table_${index}`])

      if (missingTables.length > 0) {
        return {
          status: 'not_ready' as const,
          database: 'reachable' as const,
          schema: 'not_ready' as const,
          code: 'DB_SCHEMA_NOT_READY' as const,
        }
      }

      return {
        status: 'ready' as const,
        database: 'reachable' as const,
        schema: 'ready' as const,
      }
    } catch (error) {
      return {
        status: 'not_ready' as const,
        database: 'unreachable' as const,
        schema: 'unknown' as const,
        code: getDatabaseReadinessCode(error),
      }
    }
  }
}

export const readinessService = new ReadinessService()
