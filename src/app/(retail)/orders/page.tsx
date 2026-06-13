import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/app/_lib/auth'
import { orderService } from '@/services/order.service'
import { OrderCard } from '@/components/shared/OrderCard'
import { Button } from '@/components/ui/Button'

export const metadata = { title: 'My Orders · PeeHub' }

export default async function OrdersPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const orders = await orderService.getUserOrders(session.id)

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

      {orders.length === 0 ? (
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
