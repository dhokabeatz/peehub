import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/app/_lib/auth'
import { walletService } from '@/services/wallet.service'
import { WalletBalanceCard } from '@/components/shared/WalletBalanceCard'
import { Button } from '@/components/ui/Button'

export const metadata = { title: 'Wallet · PeeHub' }

export default async function WalletPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const wallet = await walletService.getBalance(session.id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Wallet</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your wallet balance</p>
      </div>

      {wallet ? (
        <WalletBalanceCard wallet={wallet} showFundButton={false} />
      ) : (
        <div className="bg-gray-100 rounded-xl p-6 text-gray-400 text-sm">
          Could not load wallet balance.
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/wallet/fund">
          <Button size="lg">+ Fund Wallet</Button>
        </Link>
        <Link href="/buy">
          <Button variant="secondary" size="lg">Buy Data</Button>
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        <p className="font-medium mb-0.5">Manual top-up process</p>
        <p>
          Fund your wallet by initiating a top-up and sharing the reference with the admin.
          Balances are credited once payment is confirmed.
        </p>
      </div>
    </div>
  )
}
