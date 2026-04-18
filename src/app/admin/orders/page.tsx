import Link from 'next/link'
import { serverFetch } from '@/app/_lib/fetch'
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge'
import type { AdminOrder, OrderStatus } from '@/types/order'

export const metadata = { title: 'All Orders · Admin · PeeHub' }

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const query = status ? `?status=${status}` : ''
  const res = await serverFetch(`/api/admin/orders${query}`)
  const { orders = [] }: { orders: AdminOrder[] } = res.ok ? await res.json() : { orders: [] }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">All Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
        {STATUS_FILTERS.map(({ label, value }) => {
          const active = (status ?? '') === value
          return (
            <Link
              key={value}
              href={value ? `/admin/orders?status=${value}` : '/admin/orders'}
              className={[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {!res.ok && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Failed to load orders. Please refresh.
        </div>
      )}

      {orders.length === 0 && res.ok ? (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-12 text-center text-sm text-gray-400">
          No orders found{status ? ` with status "${status}"` : ''}.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Order</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Bundle</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Recipient</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {order.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.user.fullName}</p>
                      <p className="text-xs text-gray-400">
                        {order.user.email ?? order.user.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{order.bundle.name}</p>
                      <p className="text-xs text-gray-400">{order.network.name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.recipientPhone}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      GHS {order.amount}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
