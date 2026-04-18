import { notFound } from 'next/navigation'
import Link from 'next/link'
import { orderService } from '@/services/order.service'
import { OrderStatusBadge } from '@/components/shared/OrderStatusBadge'
import { AdminOrderForm } from '@/components/forms/AdminOrderForm'
import { Card } from '@/components/ui/Card'
import type { OrderStatus } from '@/types/order'

export const metadata = { title: 'Order Detail · Admin · PeeHub' }

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

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const order = await orderService.adminGetOrder(id)

  if (!order) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">
          ← Back to Orders
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <h1 className="text-xl font-bold text-gray-900">Order Detail</h1>
          <OrderStatusBadge status={order.status as OrderStatus} />
        </div>
        <p className="text-xs text-gray-400 mt-1 font-mono">{order.id}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Order info */}
        <Card title="Order">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Bundle"    value={order.bundle.name} />
            <Row label="Size"      value={formatMb(order.bundle.dataSizeMb)} />
            <Row label="Validity"  value={`${order.bundle.validityDays} days`} />
            <Row label="Network"   value={order.network.name} />
            <Row label="Recipient" value={order.recipientPhone} />
            <Row label="Amount"    value={`GHS ${order.amount}`} />
            <Row label="Placed"    value={formatDate(order.createdAt)} />
            <Row label="Updated"   value={formatDate(order.updatedAt)} />
            {order.adminNote && <Row label="Admin Note" value={order.adminNote} />}
            {order.providerReference && (
              <Row label="Provider Ref" value={order.providerReference} mono />
            )}
          </dl>
        </Card>

        {/* Customer info */}
        <Card title="Customer">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Name" value={order.user.fullName} />
            {order.user.email && <Row label="Email" value={order.user.email} />}
            {order.user.phone && <Row label="Phone" value={order.user.phone} />}
          </dl>

          {order.walletTransaction && (
            <div className="border-t border-gray-100 mt-4 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Wallet Debit
              </p>
              <dl className="flex flex-col gap-2 text-sm">
                <Row label="Reference" value={order.walletTransaction.reference} mono />
                <Row label="Amount"    value={`GHS ${order.walletTransaction.amount}`} />
                <Row label="Status"    value={order.walletTransaction.status} />
              </dl>
            </div>
          )}

          {order.refundWalletTransaction && (
            <div className="border-t border-green-100 mt-4 pt-4 bg-green-50 rounded-md px-3 py-3 -mx-1">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
                Refund Issued
              </p>
              <dl className="flex flex-col gap-2 text-sm">
                <Row label="Reference" value={order.refundWalletTransaction.reference} mono />
                <Row label="Amount"    value={`GHS ${order.refundWalletTransaction.amount}`} />
                <Row label="Status"    value={order.refundWalletTransaction.status} />
              </dl>
            </div>
          )}
        </Card>
      </div>

      {/* Update form */}
      <Card title="Update Order">
        <AdminOrderForm
          orderId={order.id}
          currentStatus={order.status as OrderStatus}
          currentAdminNote={order.adminNote}
          currentProviderRef={order.providerReference}
        />
      </Card>
    </div>
  )
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className={['text-gray-900 text-right break-all', mono ? 'font-mono text-xs' : ''].join(' ')}>
        {value}
      </dd>
    </div>
  )
}
