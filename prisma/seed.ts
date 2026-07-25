import { PrismaClient, OrderStatus, WalletTransactionType, TransactionStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

// ─── Seed data ────────────────────────────────────────────────────────────────
// Prefixes sourced from NCA Ghana number range allocations.
// Prices are in GHS (stored as Decimal in DB).

const NETWORKS = [
  {
    name: 'MTN Ghana',
    code: 'MTN',
    prefixes: ['024', '025', '054', '055', '059'],
    bundles: [
      { name: '1GB — 1 Day',    dataSizeMb: 1024,  validityDays: 1,  price: 2.50 },
      { name: '1GB — 7 Days',   dataSizeMb: 1024,  validityDays: 7,  price: 5.00 },
      { name: '2GB — 7 Days',   dataSizeMb: 2048,  validityDays: 7,  price: 8.00 },
      { name: '3GB — 30 Days',  dataSizeMb: 3072,  validityDays: 30, price: 15.00 },
      { name: '5GB — 30 Days',  dataSizeMb: 5120,  validityDays: 30, price: 20.00 },
      { name: '10GB — 30 Days', dataSizeMb: 10240, validityDays: 30, price: 35.00 },
    ],
  },
  {
    name: 'Telecel Ghana',
    code: 'TELECEL',
    prefixes: ['020', '050'],
    bundles: [
      { name: '1GB — 1 Day',   dataSizeMb: 1024, validityDays: 1,  price: 2.50 },
      { name: '1GB — 7 Days',  dataSizeMb: 1024, validityDays: 7,  price: 5.00 },
      { name: '2GB — 7 Days',  dataSizeMb: 2048, validityDays: 7,  price: 9.00 },
      { name: '5GB — 30 Days', dataSizeMb: 5120, validityDays: 30, price: 22.00 },
    ],
  },
  {
    name: 'AirtelTigo Ghana',
    code: 'AIRTELTIGO',
    prefixes: ['026', '027', '056', '057'],
    bundles: [
      { name: '1GB — 1 Day',   dataSizeMb: 1024, validityDays: 1,  price: 2.50 },
      { name: '1GB — 7 Days',  dataSizeMb: 1024, validityDays: 7,  price: 5.00 },
      { name: '3GB — 30 Days', dataSizeMb: 3072, validityDays: 30, price: 14.00 },
      { name: '5GB — 30 Days', dataSizeMb: 5120, validityDays: 30, price: 19.00 },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key]?.trim()
  if (!value) throw new Error(`Missing required seed env var: ${key}`)
  return value
}

// Stable, deterministic reference for seed records.
// Does NOT include timestamps so re-runs hit the same unique key.
function seedRef(suffix: string): string {
  return `SEED-${suffix}`
}

function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: string }).code === 'P2002'
  )
}

// ─── Seeders ──────────────────────────────────────────────────────────────────

async function seedNetworksAndBundles() {
  console.log('Seeding networks and bundles...')

  for (const { bundles, ...networkData } of NETWORKS) {
    const network = await db.network.upsert({
      where:  { code: networkData.code },
      update: { name: networkData.name, prefixes: networkData.prefixes },
      create: networkData,
    })

    console.log(`  ✓ Network: ${network.name} (${network.code})`)

    for (const bundle of bundles) {
      await db.bundle.upsert({
        where:  { networkId_name: { networkId: network.id, name: bundle.name } },
        update: { dataSizeMb: bundle.dataSizeMb, validityDays: bundle.validityDays, price: bundle.price },
        create: { ...bundle, networkId: network.id },
      })
    }

    console.log(`    ✓ ${bundles.length} bundles seeded`)
  }
}

async function seedAdmin() {
  console.log('\nSeeding admin account...')

  const adminEmail    = requireEnv('ADMIN_EMAIL')
  const adminPassword = requireEnv('ADMIN_PASSWORD')
  const adminFullName = requireEnv('ADMIN_FULL_NAME')

  const adminHash = await bcrypt.hash(adminPassword, 12)

  const admin = await db.user.upsert({
    where:  { email: adminEmail },
    update: { passwordHash: adminHash, fullName: adminFullName, role: 'admin' },
    create: {
      email:        adminEmail,
      passwordHash: adminHash,
      fullName:     adminFullName,
      role:         'admin',
      authProvider: 'local',
    },
  })

  console.log(`  ✓ Admin: ${admin.fullName} <${admin.email}>`)

  return admin
}

async function seedDemoData(adminId: string) {
  console.log('\nSeeding demo user...')

  const demoEmail    = requireEnv('DEMO_USER_EMAIL')
  const demoPassword = requireEnv('DEMO_USER_PASSWORD')
  const demoFullName = requireEnv('DEMO_USER_FULL_NAME')

  const demoHash = await bcrypt.hash(demoPassword, 12)

  const demoUser = await db.user.upsert({
    where:  { email: demoEmail },
    update: { passwordHash: demoHash, fullName: demoFullName },
    create: {
      email:        demoEmail,
      passwordHash: demoHash,
      fullName:     demoFullName,
      role:         'retail',
      authProvider: 'local',
    },
  })

  console.log(`  ✓ Demo user: ${demoUser.fullName} <${demoUser.email}>`)

  // ── Wallet ─────────────────────────────────────────────────────────────────
  const DEMO_WALLET_BALANCE = new Decimal('200.00')
  const initialFundReference = seedRef('INIT-FUND')

  let wallet = await db.wallet.findUnique({ where: { userId: demoUser.id } })
  const existingInitialFund = await db.walletTransaction.findUnique({
    where: { reference: initialFundReference },
  })

  if (!wallet) {
    wallet = await db.wallet.create({
      data: { userId: demoUser.id, balance: DEMO_WALLET_BALANCE },
    })

    if (!existingInitialFund) {
      await db.walletTransaction.create({
        data: {
          walletId:      wallet.id,
          userId:        demoUser.id,
          type:          WalletTransactionType.credit,
          amount:        DEMO_WALLET_BALANCE,
          balanceBefore: new Decimal('0'),
          balanceAfter:  DEMO_WALLET_BALANCE,
          reference:     initialFundReference,
          description:   'Demo wallet — initial seed top-up',
          status:        TransactionStatus.success,
        },
      })
    }

    console.log(`  ✓ Wallet created with GHS ${DEMO_WALLET_BALANCE} balance`)
  } else {
    console.log(`  ✓ Wallet already exists (balance: GHS ${wallet.balance}) — skipping fund`)
  }

  // Running balance — initialised from the wallet's current DB value so that
  // re-runs and fresh runs both produce a correct ledger.
  let runningBalance = new Decimal(wallet.balance.toString())

  // ── Demo orders ────────────────────────────────────────────────────────────
  console.log('\nSeeding demo orders...')

  const mtnNetwork     = await db.network.findUnique({ where: { code: 'MTN' } })
  const telecelNetwork = await db.network.findUnique({ where: { code: 'TELECEL' } })
  const airtelNetwork  = await db.network.findUnique({ where: { code: 'AIRTELTIGO' } })

  if (!mtnNetwork || !telecelNetwork || !airtelNetwork) {
    throw new Error('Networks not found — run seed again or check network upserts')
  }

  const mtn5gb   = await db.bundle.findFirst({ where: { networkId: mtnNetwork.id,     name: '5GB — 30 Days'  } })
  const mtn1gb7d = await db.bundle.findFirst({ where: { networkId: mtnNetwork.id,     name: '1GB — 7 Days'   } })
  const tel2gb   = await db.bundle.findFirst({ where: { networkId: telecelNetwork.id, name: '2GB — 7 Days'   } })
  const air3gb   = await db.bundle.findFirst({ where: { networkId: airtelNetwork.id,  name: '3GB — 30 Days'  } })
  const mtn10gb  = await db.bundle.findFirst({ where: { networkId: mtnNetwork.id,     name: '10GB — 30 Days' } })

  if (!mtn5gb || !mtn1gb7d || !tel2gb || !air3gb || !mtn10gb) {
    throw new Error('Expected bundles not found — check bundle seed data')
  }

  type DemoOrder = {
    bundle: typeof mtn5gb
    network: typeof mtnNetwork
    recipientPhone: string
    status: OrderStatus
    adminNote?: string
    providerReference?: string
    processedBy?: string
  }

  const demoOrders: DemoOrder[] = [
    // completed — has provider ref + admin note
    {
      bundle: mtn5gb,
      network: mtnNetwork,
      recipientPhone: '0244000001',
      status: OrderStatus.completed,
      adminNote: 'Bundle sent via MTN Business portal at 09:14am.',
      providerReference: 'MTN-TXN-881234',
      processedBy: adminId,
    },
    // processing — admin picked it up
    {
      bundle: tel2gb,
      network: telecelNetwork,
      recipientPhone: '0201000002',
      status: OrderStatus.processing,
      adminNote: 'Sending via Telecel portal now.',
      processedBy: adminId,
    },
    // pending — just placed
    {
      bundle: mtn1gb7d,
      network: mtnNetwork,
      recipientPhone: '0244000003',
      status: OrderStatus.pending,
    },
    // pending — another queued order
    {
      bundle: air3gb,
      network: airtelNetwork,
      recipientPhone: '0261000004',
      status: OrderStatus.pending,
    },
    // failed
    {
      bundle: mtn10gb,
      network: mtnNetwork,
      recipientPhone: '0244000005',
      status: OrderStatus.failed,
      adminNote: 'Portal returned error — customer notified, refund issued.',
      providerReference: 'MTN-ERR-991001',
      processedBy: adminId,
    },
    // cancelled
    {
      bundle: mtn1gb7d,
      network: mtnNetwork,
      recipientPhone: '0244000006',
      status: OrderStatus.cancelled,
      adminNote: 'Customer requested cancellation before processing.',
    },
  ]

  for (const order of demoOrders) {
    const amount = new Decimal(order.bundle.price.toString())

    // Idempotency key: stable reference derived from the recipient phone.
    // WalletTransaction.reference is @unique, so a hit means this order was
    // already seeded — sync the running balance and skip.
    const debitRef = seedRef(`ORDER-${order.recipientPhone}`)

    const existing = await db.walletTransaction.findUnique({ where: { reference: debitRef } })

    if (existing) {
      console.log(`  ↩ Order [${order.status.padEnd(10)}] ${order.bundle.name} → ${order.recipientPhone} (already seeded, skipping)`)
      // Sync running balance from DB so subsequent orders use the correct
      // balanceBefore on this re-run, not a stale in-memory value.
      runningBalance = new Decimal(existing.balanceAfter.toString())
      continue
    }

    const txStatus =
      order.status === OrderStatus.completed ? TransactionStatus.success :
      order.status === OrderStatus.failed    ? TransactionStatus.failed  :
      order.status === OrderStatus.cancelled ? TransactionStatus.failed  :
                                               TransactionStatus.pending

    const balanceBefore = runningBalance
    const balanceAfter  = runningBalance.minus(amount)

    try {
      // Wrap in $transaction so the walletTransaction and order are always
      // created together. try/catch handles a P2002 on the unique reference
      // (race condition or partial prior run) — log a warning and continue
      // instead of crashing the entire seed.
      await db.$transaction(async (tx) => {
        const walletTx = await tx.walletTransaction.create({
          data: {
            walletId:      wallet!.id,
            userId:        demoUser.id,
            type:          WalletTransactionType.debit,
            amount:        amount.toFixed(2),
            balanceBefore: balanceBefore.toFixed(2),
            balanceAfter:  balanceAfter.toFixed(2),
            reference:     debitRef,
            description:   `Order — ${order.bundle.name} for ${order.recipientPhone}`,
            status:        txStatus,
          },
        })

        await tx.order.create({
          data: {
            userId:              demoUser.id,
            bundleId:            order.bundle.id,
            networkId:           order.network.id,
            walletTransactionId: walletTx.id,
            recipientPhone:      order.recipientPhone,
            amount:              amount.toFixed(2),
            status:              order.status,
            ...(order.adminNote         ? { adminNote: order.adminNote }                : {}),
            ...(order.providerReference ? { providerReference: order.providerReference } : {}),
            ...(order.processedBy       ? { processedBy: order.processedBy }            : {}),
          },
        })
      })

      runningBalance = balanceAfter
      console.log(`  ✓ Order [${order.status.padEnd(10)}] ${order.bundle.name} → ${order.recipientPhone}`)
    } catch (e: unknown) {
      if (isUniqueConstraintError(e)) {
        console.warn(`  ⚠ Order ${order.recipientPhone} — unique constraint hit mid-run, skipping`)
        continue
      }
      throw e
    }
  }

  // Sync wallet balance to the final running total.
  // On re-runs where all orders were skipped, runningBalance equals the
  // existing wallet balance so this update is a safe no-op.
  await db.wallet.update({
    where: { id: wallet!.id },
    data:  { balance: runningBalance.toFixed(2) },
  })

  console.log(`\n  ✓ Wallet balance: GHS ${runningBalance.toFixed(2)}`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const mode = (process.env.SEED_MODE ?? 'dev').toLowerCase()

  if (mode !== 'prod' && mode !== 'dev') {
    throw new Error(`SEED_MODE must be "prod" or "dev" (got "${mode}")`)
  }

  console.log(`\n── Xpress Data Bundles seed (SEED_MODE=${mode}) ─────────────────────────────\n`)

  await seedNetworksAndBundles()
  const admin = await seedAdmin()

  if (mode === 'dev') {
    await seedDemoData(admin.id)
  } else {
    console.log('\nSKIPPING demo data (SEED_MODE=prod)')
  }

  console.log('\nSeed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
