import Link from 'next/link'
import { userService } from '@/services/user.service'
import { Badge } from '@/components/ui/Badge'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminEmptyState } from '@/components/admin/AdminEmptyState'
import { AdminTableShell } from '@/components/admin/AdminTableShell'
import { formatPageTitle } from '@/lib/brand'

export const metadata = { title: formatPageTitle('Admin Users') }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDiscount(discount: {
  type: 'percentage' | 'fixed'
  value: string
  status: 'active' | 'scheduled' | 'expired' | 'inactive'
} | null) {
  if (!discount) return 'None'

  const label = discount.type === 'percentage'
    ? `${discount.value}% off`
    : `GHS ${discount.value} off`

  if (discount.status === 'active') return label
  return `${label} (${discount.status})`
}

export default async function AdminUsersPage() {
  const users = await userService.adminListUsers()

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Users"
        description="View registered customers, account status, and wallet summaries."
        meta={`${users.length} user${users.length !== 1 ? 's' : ''} registered`}
      />

      {users.length === 0 ? (
        <AdminEmptyState
          title="No users found"
          description="Registered users will appear here once accounts are created."
        />
      ) : (
        <AdminTableShell>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Wallet</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Discount</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Orders</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Joined</th>
                  <th className="px-4 py-3 font-medium text-gray-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-xs text-gray-400">{user.email ?? user.phone ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 capitalize">{user.role}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.isActive ? 'success' : 'muted'}>
                        {user.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {user.walletBalance ? `GHS ${user.walletBalance}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatDiscount(user.discount)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{user.orderCount}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        View
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
