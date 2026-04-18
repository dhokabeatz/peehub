import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/app/_lib/auth'
import { walletService } from '@/services/wallet.service'
import { orderService } from '@/services/order.service'
import { WalletBalanceCard } from '@/components/shared/WalletBalanceCard'
import { OrderCard } from '@/components/shared/OrderCard'
import { Button } from '@/components/ui/Button'

export const metadata = { title: 'Dashboard · PeeHub' }

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const [wallet, orders] = await Promise.all([
    walletService.getBalance(session.id),
    orderService.getUserOrders(session.id),
  ])

  const recentOrders = orders.slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your account</p>
      </div>

      {/* Balance */}
      {wallet ? (
        <WalletBalanceCard wallet={wallet} />
      ) : (
        <div className="bg-gray-100 rounded-xl p-6 text-gray-400 text-sm">
          Could not load wallet balance.
        </div>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/buy">
            <Button size="lg">Buy Data</Button>
          </Link>
          <Link href="/wallet/fund">
            <Button variant="secondary" size="lg">Fund Wallet</Button>
          </Link>
          <Link href="/orders">
            <Button variant="ghost" size="lg">View Orders</Button>
          </Link>
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Recent Orders</h2>
          <Link href="/orders" className="text-xs text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg px-5 py-8 text-center text-sm text-gray-400">
            No orders yet.{' '}
            <Link href="/buy" className="text-blue-600 hover:underline">
              Buy your first bundle
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
