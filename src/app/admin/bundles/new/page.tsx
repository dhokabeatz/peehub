import Link from 'next/link'
import { notFound } from 'next/navigation'
import { bundleService } from '@/services/bundle.service'
import { AdminBundleForm } from '@/components/forms/AdminBundleForm'
import { Card } from '@/components/ui/Card'

export const metadata = { title: 'New Bundle · Admin · PeeHub' }

export default async function AdminNewBundlePage() {
  const networks = await bundleService.getNetworks()

  if (networks.length === 0) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link href="/admin/bundles" className="text-sm text-blue-600 hover:underline">
          ← Back to Bundles
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-3">Create Bundle</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Assign the bundle to a network now. Network assignment cannot be changed later.
        </p>
      </div>

      <Card title="Bundle Details">
        <AdminBundleForm mode="create" networks={networks} />
      </Card>
    </div>
  )
}
