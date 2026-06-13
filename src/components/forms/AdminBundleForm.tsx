'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AdminBundle, BundleNetworkSummary } from '@/types/bundle'

interface AdminBundleFormProps {
  mode: 'create' | 'edit'
  networks: BundleNetworkSummary[]
  bundle?: AdminBundle
}

function formatMb(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

export function AdminBundleForm({ mode, networks, bundle }: AdminBundleFormProps) {
  const router = useRouter()
  const isEdit = mode === 'edit'
  const usedInOrders = bundle?.usedInOrders ?? false

  const [name, setName] = useState(bundle?.name ?? '')
  const [networkId, setNetworkId] = useState(bundle?.networkId ?? networks[0]?.id ?? '')
  const [dataSizeMb, setDataSizeMb] = useState(String(bundle?.dataSizeMb ?? ''))
  const [validityDays, setValidityDays] = useState(String(bundle?.validityDays ?? ''))
  const [price, setPrice] = useState(bundle?.price ?? '')
  const [isActive, setIsActive] = useState(bundle?.isActive ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)

    const numericDataSize = Number(dataSizeMb)
    const numericValidity = Number(validityDays)
    const numericPrice = Number(price)

    try {
      const res = await fetch(
        isEdit ? `/api/admin/bundles/${bundle?.id}` : '/api/admin/bundles',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isEdit
              ? {
                  price: numericPrice,
                  dataSizeMb: numericDataSize,
                  validityDays: numericValidity,
                  isActive,
                }
              : {
                  name: name.trim(),
                  networkId,
                  dataSizeMb: numericDataSize,
                  validityDays: numericValidity,
                  price: numericPrice,
                },
          ),
        },
      )

      const data = await res.json()

      if (res.ok) {
        setSaved(true)
        if (isEdit) {
          router.refresh()
        } else {
          router.push(`/admin/bundles/${data.bundle.id}`)
          router.refresh()
        }
        return
      }

      if (res.status === 409 && Array.isArray(data.fields)) {
        setError(`${data.error}. Locked fields: ${data.fields.join(', ')}`)
      } else {
        setError(data.error ?? 'Failed to save bundle. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm text-green-700">
          Bundle {isEdit ? 'updated' : 'created'} successfully.
        </div>
      )}

      <Input
        label="Bundle Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. 5GB - 30 Days"
        required
        disabled={isEdit}
        hint={isEdit ? 'Bundle name is fixed after creation.' : undefined}
      />

      {isEdit ? (
        <Input
          label="Network"
          value={bundle?.network.name ?? ''}
          disabled
          hint="Network assignment is immutable after creation."
        />
      ) : (
        <div className="flex flex-col gap-1">
          <label htmlFor="networkId" className="text-sm font-medium text-gray-700">
            Network
          </label>
          <select
            id="networkId"
            value={networkId}
            onChange={(e) => setNetworkId(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            {networks.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Data Size (MB)"
          type="number"
          min="1"
          step="1"
          value={dataSizeMb}
          onChange={(e) => setDataSizeMb(e.target.value)}
          required
          disabled={isEdit && usedInOrders}
          hint={
            isEdit && usedInOrders
              ? 'This bundle has order history, so its size is locked.'
              : bundle?.dataSizeMb
                ? `Current display size: ${formatMb(bundle.dataSizeMb)}`
                : undefined
          }
        />

        <Input
          label="Validity (Days)"
          type="number"
          min="1"
          step="1"
          value={validityDays}
          onChange={(e) => setValidityDays(e.target.value)}
          required
          disabled={isEdit && usedInOrders}
          hint={
            isEdit && usedInOrders
              ? 'This bundle has order history, so its validity is locked.'
              : undefined
          }
        />
      </div>

      <Input
        label="Price (GHS)"
        type="number"
        min="0.01"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
        hint="Price can always be updated."
      />

      {isEdit && (
        <label className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            <strong className="text-gray-900">Active bundle</strong>
            <span className="block text-xs text-gray-500 mt-0.5">
              Activate or deactivate without deleting the bundle.
            </span>
          </span>
        </label>
      )}

      {bundle && (
        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-3 text-sm text-gray-600">
          <p>
            Used in orders: <strong className="text-gray-900">{bundle.orderCount}</strong>
          </p>
          {usedInOrders && (
            <p className="mt-1">
              Core attributes are locked once a bundle has been used. Price and activation
              status remain editable.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Save Changes' : 'Create Bundle'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (isEdit) {
              window.location.reload()
              return
            }
            router.push('/admin/bundles')
          }}
        >
          {isEdit ? 'Reset Form' : 'Cancel'}
        </Button>
      </div>
    </form>
  )
}
