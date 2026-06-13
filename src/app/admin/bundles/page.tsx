import Link from 'next/link'
import { bundleService } from '@/services/bundle.service'
export const metadata = { title: 'Bundles · Admin · PeeHub' }

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bundles</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage bundle pricing, validity, size, and activation state.
          </p>
        </div>
        <Link
          href="/admin/bundles/new"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          Create Bundle
        </Link>
      </div>

      {bundles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-12 text-center text-sm text-gray-400">
          No bundles found.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
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
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                          bundle.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600',
                        ].join(' ')}
                      >
                        {bundle.isActive ? 'Active' : 'Inactive'}
                      </span>
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
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Manage →
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
