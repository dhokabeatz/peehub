import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { WalletBalance } from '@/types/wallet'

interface WalletBalanceCardProps {
  wallet: WalletBalance
  showFundButton?: boolean
}

export function WalletBalanceCard({ wallet, showFundButton = true }: WalletBalanceCardProps) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-md">
      <p className="text-sm font-medium text-blue-100 mb-1">Wallet Balance</p>
      <p className="text-4xl font-bold tracking-tight">
        {wallet.currency} {parseFloat(wallet.balance).toFixed(2)}
      </p>
      {showFundButton && (
        <Link href="/wallet/fund" className="mt-4 inline-block">
          <Button variant="secondary" size="sm" className="mt-4 text-blue-700">
            + Fund Wallet
          </Button>
        </Link>
      )}
    </div>
  )
}
