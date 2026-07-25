import Link from 'next/link'
import { notFound } from 'next/navigation'
import { bundleService } from '@/services/bundle.service'
import { AdminBundleForm } from '@/components/forms/AdminBundleForm'
import { Card } from '@/components/ui/Card'
import { formatPageTitle } from '@/lib/brand'

export const metadata = { title: formatPageTitle('Admin Bundle Detail') }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminBundleDetailPage({ params }: PageProps) {
  const { id } = await params
  const [bundle, networks] = await Promise.all([
    bundleService.adminGetBundleById(id),
    bundleService.getNetworks(),
  ])

  if (!bundle) notFound()

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link href="/admin/bundles" className="text-sm text-blue-600 hover:underline">
          ← Back to Bundles
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <h1 className="text-xl font-bold text-gray-900">Bundle Detail</h1>
          <span
            className={[
              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
              bundle.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600',
            ].join(' ')}
          >
            {bundle.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-mono">{bundle.id}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Bundle">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Name" value={bundle.name} />
            <Row label="Network" value={bundle.network.name} />
            <Row label="Network Code" value={bundle.network.code} mono />
            <Row label="Orders" value={String(bundle.orderCount)} />
            <Row label="Created" value={formatDate(bundle.createdAt)} />
            <Row label="Updated" value={formatDate(bundle.updatedAt)} />
          </dl>
        </Card>

        <Card title="Editing Rules">
          <dl className="flex flex-col gap-2 text-sm text-gray-700">
            <div>
              <dt className="font-medium text-gray-900">Always allowed</dt>
              <dd>Price updates and activate/deactivate.</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Never allowed</dt>
              <dd>Changing network assignment after creation.</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Locked after first order</dt>
              <dd>Data size and validity.</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card title="Edit Bundle">
        <AdminBundleForm mode="edit" bundle={bundle} networks={networks} />
      </Card>
    </div>
  )
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className={['text-gray-900 text-right break-all', mono ? 'font-mono text-xs' : ''].join(' ')}>
        {value}
      </dd>
    </div>
  )
}
