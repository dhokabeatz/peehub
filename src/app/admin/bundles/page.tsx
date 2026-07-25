import Link from 'next/link'
import { bundleService } from '@/services/bundle.service'
import { Badge } from '@/components/ui/Badge'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminTableShell } from '@/components/admin/AdminTableShell'
import { formatPageTitle } from '@/lib/brand'

export const metadata = { title: formatPageTitle('Admin Bundles') }

function formatMoney(price: string) {
  return `GHS ${price}`
}

function formatMb(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

export default async function AdminBundlesPage() {
  const bundles = await bundleService.adminListBundles()

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Bundles"
        description="Manage bundle pricing, validity, size, and activation state."
        meta={`${bundles.length} bundle${bundles.length !== 1 ? 's' : ''} available`}
        actions={
          <Link
            href="/admin/bundles/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            Create Bundle
          </Link>
        }
      />

      {bundles.length === 0 ? (
        <AdminEmptyState
          title="No bundles found"
          description="Create your first data bundle to make it available for buyers."
        />
      ) : (
        <AdminTableShell>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Bundle</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Network</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Size</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Validity</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Price</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Orders</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bundles.map((bundle) => (
                  <tr key={bundle.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{bundle.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{bundle.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{bundle.network.name}</p>
                      <p className="text-xs text-gray-400">{bundle.network.code}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatMb(bundle.dataSizeMb)}</td>
                    <td className="px-4 py-3 text-gray-700">{bundle.validityDays} days</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatMoney(bundle.price)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={bundle.isActive ? 'success' : 'muted'}>
                        {bundle.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {bundle.orderCount}
                      {bundle.usedInOrders && (
                        <span className="block text-xs text-amber-600">Core locked</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/bundles/${bundle.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </AdminTableShell>
      )}
    </div>
  )
}
