import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const APPLICATION_TABLES = [
  'users',
  'wallets',
  'wallet_transactions',
  'payment_transactions',
  'networks',
  'bundles',
  'orders',
  'refresh_tokens',
  'password_reset_tokens',
]

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    `SELECT tablename
     FROM pg_tables
     WHERE schemaname = 'public'
     ORDER BY tablename ASC`,
  )

  const tableNames = tables.map((row) => row.tablename)
  const hasApplicationTables = APPLICATION_TABLES.some((table) => tableNames.includes(table))

  const migrationTableRows = await prisma.$queryRawUnsafe(
    `SELECT to_regclass('public._prisma_migrations')::text AS table_name`,
  )
  const migrationTableExists = Boolean(migrationTableRows[0]?.table_name)

  let migrationRecords = []

  if (migrationTableExists) {
    migrationRecords = await prisma.$queryRawUnsafe(
      `SELECT migration_name, finished_at, rolled_back_at
       FROM public._prisma_migrations
       ORDER BY started_at ASC`,
    )
  }

  const appliedMigrationNames = migrationRecords.map((row) => row.migration_name)
  const baselineApplied = appliedMigrationNames.includes('20260418000100_init_schema')
  const baselineNeeded = hasApplicationTables && !baselineApplied
  const likelyDbPushBootstrap = hasApplicationTables && !migrationTableExists

  const report = {
    publicTables: tableNames,
    migrationTableExists,
    migrationRecords,
    likelyDbPushBootstrap,
    baselineNeeded,
  }

  console.log(JSON.stringify(report, null, 2))

  if (process.env.GITHUB_OUTPUT) {
    const lines = [
      `baseline_needed=${baselineNeeded}`,
      `has_application_tables=${hasApplicationTables}`,
      `migration_table_exists=${migrationTableExists}`,
      `likely_db_push_bootstrap=${likelyDbPushBootstrap}`,
    ]
    await import('node:fs/promises').then((fs) =>
      fs.appendFile(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`),
    )
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
