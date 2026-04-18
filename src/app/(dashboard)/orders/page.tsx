import Link from 'next/link'
import { serverFetch } from '@/app/_lib/fetch'
import { OrderCard } from '@/components/shared/OrderCard'
import { Button } from '@/components/ui/Button'
import type { Order } from '@/types/order'

export const metadata = { title: 'My Orders · PeeHub' }

export default async function OrdersPage() {
  const res = await serverFetch('/api/orders')
  const { orders = [] }: { orders: Order[] } = res.ok ? await res.json() : { orders: [] }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your data bundle purchase history</p>
        </div>
        <Link href="/buy">
          <Button size="sm">+ Buy Data</Button>
        </Link>
      </div>

      {!res.ok && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Failed to load orders (HTTP {res.status}). Please refresh the page.
        </div>
      )}

      {orders.length === 0 && res.ok ? (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-12 text-center">
          <p className="text-gray-400 text-sm mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/buy">
            <Button>Buy Your First Bundle</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
