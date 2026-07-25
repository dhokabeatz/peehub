import { adminDashboardService } from '@/services/admin-dashboard.service'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { formatPageTitle } from '@/lib/brand'

export const metadata = { title: formatPageTitle('Admin Dashboard') }

type AdminDashboardMetricKey =
  | 'totalUsers'
  | 'activeUsers'
  | 'suspendedUsers'
  | 'totalOrders'
  | 'pendingOrders'
  | 'processingOrders'
  | 'completedOrders'
  | 'failedOrders'
  | 'cancelledOrders'
  | 'totalCompletedOrderValue'
  | 'totalWalletFundingValue'
  | 'pendingPaymentCount'

interface AdminDashboardMetricDefinition {
  key: AdminDashboardMetricKey
  label: string
  format?: 'currency'
}

function formatCurrency(amount: string) {
  const numericAmount = Number(amount)
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericAmount) ? numericAmount : 0)
}

const metricSections = [
  {
    title: 'Users',
    metrics: [
      { key: 'totalUsers', label: 'Total Users' },
      { key: 'activeUsers', label: 'Active Users' },
      { key: 'suspendedUsers', label: 'Suspended Users' },
    ],
  },
  {
    title: 'Orders',
    metrics: [
      { key: 'totalOrders', label: 'Total Orders' },
      { key: 'pendingOrders', label: 'Pending Orders' },
      { key: 'processingOrders', label: 'Processing Orders' },
      { key: 'completedOrders', label: 'Completed Orders' },
      { key: 'failedOrders', label: 'Failed Orders' },
      { key: 'cancelledOrders', label: 'Cancelled Orders' },
      { key: 'totalCompletedOrderValue', label: 'Completed Order Value', format: 'currency' },
    ],
  },
  {
    title: 'Payments',
    metrics: [
      { key: 'totalWalletFundingValue', label: 'Wallet Funding Value', format: 'currency' },
      { key: 'pendingPaymentCount', label: 'Pending Payments' },
    ],
  },
] satisfies ReadonlyArray<{
  title: string
  metrics: ReadonlyArray<AdminDashboardMetricDefinition>
}>

export default async function AdminDashboardPage() {
  const metrics = await adminDashboardService.getMetrics()

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title="Dashboard"
        description="Business summary metrics across users, orders, and wallet funding."
      />

      {metricSections.map((section) => (
        <section key={section.title} className="flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {section.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {section.metrics.map((metric) => {
              const rawValue = metrics[metric.key]
              const value =
                'format' in metric && metric.format === 'currency' && typeof rawValue === 'string'
                  ? formatCurrency(rawValue)
                  : rawValue

              return (
                <div
                  key={metric.key}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <p className="text-sm font-medium text-gray-500">{metric.label}</p>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {value}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
