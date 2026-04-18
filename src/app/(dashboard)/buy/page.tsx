import { BuyDataForm } from '@/components/forms/BuyDataForm'

export const metadata = { title: 'Buy Data · PeeHub' }

export default function BuyPage() {
  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Buy Data</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Select a network and bundle, then enter the recipient number.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-6 py-6">
        <BuyDataForm />
      </div>
    </div>
  )
}
