import Link from 'next/link'
import { FundWalletForm } from '@/components/forms/FundWalletForm'

export const metadata = { title: 'Fund Wallet · PeeHub' }

export default function FundWalletPage() {
  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <Link href="/wallet" className="text-sm text-blue-600 hover:underline">
          ← Back to Wallet
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-3">Fund Wallet</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Initiate a top-up and share the reference with the admin.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-6">
        <FundWalletForm />
      </div>
    </div>
  )
}
