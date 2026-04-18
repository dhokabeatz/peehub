import { db } from '@/lib/db'
import { Card } from '@/components/ui/Card'
import { ConfirmPaymentForm } from '@/components/forms/ConfirmPaymentForm'

export const metadata = { title: 'Wallet Confirmations · Admin · PeeHub' }

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

export default async function AdminWalletPage() {
  const payments = await db.paymentTransaction.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      providerReference: true,
      amount: true,
      provider: true,
      status: true,
      createdAt: true,
      user: {
        select: { fullName: true, email: true, phone: true },
      },
    },
  })

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Wallet Confirmations</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manually confirm pending wallet funding requests.
        </p>
      </div>

      {/* Confirm form */}
      <Card title="Confirm Payment" description="Enter a payment reference to credit the user's wallet.">
        <ConfirmPaymentForm />
      </Card>

      {/* Pending payments table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Pending Requests
          <span className="ml-2 text-xs font-normal text-gray-400">
            ({payments.length} pending)
          </span>
        </h2>

        {payments.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl px-6 py-10 text-center text-sm text-gray-400">
            No pending funding requests.
          </div>
        )}

        {payments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">Reference</th>
                    <th className="px-4 py-3 font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        {p.providerReference ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.user.fullName}</p>
                        <p className="text-xs text-gray-400">{p.user.email ?? p.user.phone ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        GHS {p.amount.toString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(p.createdAt.toISOString())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
