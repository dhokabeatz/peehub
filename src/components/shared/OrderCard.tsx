import { OrderStatusBadge } from './OrderStatusBadge'
import type { Order } from '@/types/order'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatMb(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

export function OrderCard({ order }: { order: Order }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <OrderStatusBadge status={order.status} />
      </div>
    </div>
  )
}
