import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ConfirmPaymentForm } from '@/components/forms/ConfirmPaymentForm'
import { adminPaymentService } from '@/services/admin-payment.service'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminTableShell } from '@/components/admin/AdminTableShell'
import type { AdminPaymentProvider, AdminPaymentStatus } from '@/types/payment'
import { formatPageTitle } from '@/lib/brand'

export const metadata = { title: formatPageTitle('Admin Wallet Reconciliation') }

export const dynamic = 'force-dynamic'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildFilterHref(status?: string, provider?: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (provider) params.set('provider', provider)
  const query = params.toString()
  return query ? `/admin/wallet?${query}` : '/admin/wallet'
}

const STATUS_FILTERS: Array<{ label: string; value?: AdminPaymentStatus }> = [
  { label: 'All Statuses' },
  { label: 'Pending', value: 'pending' },
  { label: 'Success', value: 'success' },
  { label: 'Failed', value: 'failed' },
]

const PROVIDER_FILTERS: Array<{ label: string; value?: AdminPaymentProvider }> = [
  { label: 'All Providers' },
  { label: 'Paystack', value: 'paystack' },
  { label: 'Manual', value: 'manual' },
]

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'success' ? 'success' : status === 'failed' ? 'danger' : 'warning'

  return (
    <Badge variant={variant}>{status}</Badge>
  )
}

interface PageProps {
  searchParams: Promise<{ status?: string; provider?: string }>
}

export default async function AdminWalletPage({ searchParams }: PageProps) {
  const { status, provider } = await searchParams
  const payments = await adminPaymentService.listPayments({
    status: status as AdminPaymentStatus | undefined,
    provider: provider as AdminPaymentProvider | undefined,
  })

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Wallet Reconciliation"
        description="Review wallet funding history and reconcile payment transactions."
        meta={`${payments.length} record${payments.length !== 1 ? 's' : ''} shown`}
      />

      <Card title="Confirm Payment" description="Enter a payment reference to credit the user's wallet.">
        <ConfirmPaymentForm />
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Payment History</h2>
            <p className="mt-1 text-xs text-gray-500">
              Filter by transaction status and funding provider.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
              {STATUS_FILTERS.map((option) => {
                const active = (status ?? '') === (option.value ?? '')
                return (
                  <Link
                    key={option.label}
                    href={buildFilterHref(option.value, provider)}
                    className={[
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {option.label}
                  </Link>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-1 w-fit">
              {PROVIDER_FILTERS.map((option) => {
                const active = (provider ?? '') === (option.value ?? '')
                return (
                  <Link
                    key={option.label}
                    href={buildFilterHref(status, option.value)}
                    className={[
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {option.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {payments.length === 0 && (
          <AdminEmptyState
            title="No payment transactions found"
            description="Try a different status or provider filter to broaden the results."
          />
        )}

        {payments.length > 0 && (
          <AdminTableShell>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">Reference</th>
                    <th className="px-4 py-3 font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Provider</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Created</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {p.reference ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.user.fullName}</p>
                        <p className="text-xs text-gray-400">{p.user.email ?? p.user.phone ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        GHS {p.amount}
                      </td>
                      <td className="px-4 py-3 text-gray-700 capitalize">{p.provider}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(p.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </AdminTableShell>
        )}
      </div>
    </div>
  )
}
