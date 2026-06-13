import Link from 'next/link'
import { userService } from '@/services/user.service'

export const metadata = { title: 'Users · Admin · PeeHub' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminUsersPage() {
  const users = await userService.adminListUsers()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {users.length} user{users.length !== 1 ? 's' : ''} registered
        </p>
      </div>

      {users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-12 text-center text-sm text-gray-400">
          No users found.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Wallet</th>
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
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600',
                        ].join(' ')}
                      >
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {user.walletBalance ? `GHS ${user.walletBalance}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{user.orderCount}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
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
