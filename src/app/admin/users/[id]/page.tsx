import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/app/_lib/auth'
import { userService } from '@/services/user.service'
import { Card } from '@/components/ui/Card'
import { AdminUserStatusForm } from '@/components/forms/AdminUserStatusForm'
import { AdminUserDiscountForm } from '@/components/forms/AdminUserDiscountForm'
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge'
import type { OrderStatus } from '@/types/order'
import { Badge } from '@/components/ui/Badge'
import { formatPageTitle } from '@/lib/brand'

export const metadata = { title: formatPageTitle('Admin User Detail') }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMb(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id } = await params
  const [session, user] = await Promise.all([
    getServerSession(),
    userService.adminGetUserById(id),
  ])

  if (!user) notFound()

  const isSelf = session?.id === user.id

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
          ← Back to Users
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <h1 className="text-xl font-bold text-gray-900">User Detail</h1>
          <Badge variant={user.isActive ? 'success' : 'muted'}>
            {user.isActive ? 'Active' : 'Suspended'}
          </Badge>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-mono">{user.id}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Profile">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Name" value={user.fullName} />
            <Row label="Email" value={user.email ?? '—'} />
            <Row label="Phone" value={user.phone ?? '—'} />
            <Row label="Role" value={user.role} capitalize />
            <Row label="Joined" value={formatDate(user.createdAt)} />
            <Row label="Updated" value={formatDate(user.updatedAt)} />
          </dl>
        </Card>

        <Card title="Wallet">
          {user.wallet ? (
            <dl className="flex flex-col gap-2 text-sm">
              <Row label="Balance" value={`GHS ${user.wallet.balance}`} />
              <Row label="Created" value={formatDate(user.wallet.createdAt)} />
              <Row label="Updated" value={formatDate(user.wallet.updatedAt)} />
            </dl>
          ) : (
            <p className="text-sm text-gray-400">No wallet record found for this user.</p>
          )}
        </Card>
      </div>

      <Card title="User Controls">
        <AdminUserStatusForm userId={user.id} isActive={user.isActive} isSelf={isSelf} />
      </Card>

      <Card title="Discount" description="Manage user-specific pricing without changing bundle base prices.">
        <AdminUserDiscountForm
          userId={user.id}
          discount={user.discount}
          history={user.discountHistory}
        />
      </Card>

      <Card title="Recent Orders" description={`Latest ${user.recentOrders.length} of ${user.orderCount} total orders`}>
        {user.recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {user.recentOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-gray-200 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{order.bundle.name}</span>
                    <span className="text-gray-400 text-xs">·</span>
                    <span className="text-gray-500 text-xs">{order.network.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{formatMb(order.bundle.dataSizeMb)}</span>
                    <span>·</span>
                    <span>{order.bundle.validityDays}d validity</span>
                    <span>·</span>
                    <span>→ {order.recipientPhone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">GHS {order.amount}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <OrderStatusBadge status={order.status as OrderStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Wallet Transactions" description={`Latest ${user.walletTransactions.length} transactions`}>
        {user.walletTransactions.length === 0 ? (
          <p className="text-sm text-gray-400">No wallet transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Reference</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Balance</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {user.walletTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{tx.reference}</td>
                    <td className="px-4 py-3 text-gray-700 capitalize">{tx.type}</td>
                    <td className="px-4 py-3 text-gray-900">GHS {tx.amount}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {tx.balanceBefore} → {tx.balanceAfter}
                    </td>
                    <td className="px-4 py-3 text-gray-700 capitalize">{tx.status}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function Row({
  label,
  value,
  capitalize = false,
}: {
  label: string
  value: string
  capitalize?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className={['text-gray-900 text-right break-all', capitalize ? 'capitalize' : ''].join(' ')}>
        {value}
      </dd>
    </div>
  )
}
