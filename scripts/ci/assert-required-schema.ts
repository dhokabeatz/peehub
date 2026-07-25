import { PrismaClient } from '@prisma/client'

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

const db = new PrismaClient()

async function main() {
  const tableExpressions = REQUIRED_TABLES.map(
    (tableName, index) => `to_regclass('${tableName}')::text AS table_${index}`,
  ).join(', ')

  const rows = await db.$queryRawUnsafe<Array<Record<string, string | null>>>(
    `SELECT ${tableExpressions}`,
  )

  const row = rows[0] ?? {}
  const missingTables = REQUIRED_TABLES.filter((_, index) => !row[`table_${index}`])

  if (missingTables.length > 0) {
    console.error(
      JSON.stringify(
        {
          status: 'schema_not_ready',
          missingTables,
        },
        null,
        2,
      ),
    )
    process.exit(1)
  }

  console.log(
    JSON.stringify(
      {
        status: 'schema_ready',
        requiredTables: REQUIRED_TABLES,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          status: 'schema_check_failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        null,
        2,
      ),
    )
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
