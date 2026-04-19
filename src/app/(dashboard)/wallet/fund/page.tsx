import Link from 'next/link'
import { FundWalletForm } from '@/components/forms/FundWalletForm'

export const metadata = { title: 'Fund Wallet · PeeHub' }

const isPaystack = process.env.PAYMENT_PROVIDER === 'paystack'

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function FundWalletPage({ searchParams }: PageProps) {
  const { error } = await searchParams

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <Link href="/wallet" className="text-sm text-blue-600 hover:underline">
          ← Back to Wallet
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-3">Fund Wallet</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isPaystack
            ? 'Pay securely via Paystack. Your wallet is credited automatically on payment.'
            : 'Initiate a top-up and share the reference with the admin.'}
        </p>
      </div>

      {error === 'payment_failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Your payment could not be verified. If you were charged, please contact support with your reference.
        </div>
      )}

      {error === 'missing_reference' && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Something went wrong with the payment redirect. Please try again.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-6">
        <FundWalletForm />
      </div>
    </div>
  )
}
