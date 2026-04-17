import { db } from '@/lib/db'

// All DB access for Wallets and WalletTransactions goes through this file.
// IMPORTANT: balance mutations must always use SELECT FOR UPDATE inside $transaction().

export async function getWalletByUserId(_userId: string) {
  // TODO: Phase 3
  void db
  throw new Error('Not implemented')
}

export async function debitWalletTx(
  _tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  _walletId: string,
  _amount: number,
  _description: string,
  _reference: string,
) {
  // TODO: Phase 4
  // Called inside db.$transaction() — receives the Prisma transaction client.
  // 1. SELECT ... FOR UPDATE on wallet row
  // 2. Check balance >= amount
  // 3. Decrement balance
  // 4. Create WalletTransaction (type=debit, status=completed)
  throw new Error('Not implemented')
}

export async function creditWalletByReference(_reference: string) {
  // TODO: Phase 6
  // 1. db.$transaction()
  // 2. SELECT ... FOR UPDATE on wallet
  // 3. Increment balance
  // 4. Mark WalletTransaction status=completed
  throw new Error('Not implemented')
}
