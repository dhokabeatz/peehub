'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type { UserDiscountSummary, DiscountType } from '@/types/discount'

interface AdminUserDiscountFormProps {
  userId: string
  discount: UserDiscountSummary | null
  history: UserDiscountSummary[]
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ''

  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function toIsoOrNull(value: string) {
  return value ? new Date(value).toISOString() : null
}

function formatDiscountLabel(discount: UserDiscountSummary) {
  return discount.type === 'percentage'
    ? `${discount.value}% off`
    : `GHS ${discount.value} off`
}

function badgeVariant(status: UserDiscountSummary['status']) {
  switch (status) {
    case 'active':
      return 'success'
    case 'scheduled':
      return 'info'
    case 'expired':
      return 'warning'
    case 'inactive':
      return 'muted'
  }
}

export function AdminUserDiscountForm({
  userId,
  discount,
  history,
}: AdminUserDiscountFormProps) {
  const router = useRouter()

  const [type, setType] = useState<DiscountType>('percentage')
  const [value, setValue] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [savingNew, setSavingNew] = useState(false)
  const [updatingCurrent, setUpdatingCurrent] = useState(false)
  const [replaceError, setReplaceError] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [currentIsActive, setCurrentIsActive] = useState(discount?.isActive ?? false)
  const [currentStartsAt, setCurrentStartsAt] = useState(toDateTimeLocal(discount?.startsAt ?? null))
  const [currentEndsAt, setCurrentEndsAt] = useState(toDateTimeLocal(discount?.endsAt ?? null))

  async function handleReplace(e: React.FormEvent) {
    e.preventDefault()
    setSavingNew(true)
    setReplaceError('')
    setSavedMessage('')

    try {
      const res = await fetch(`/api/admin/users/${userId}/discount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          value: Number(value),
          isActive,
          startsAt: toIsoOrNull(startsAt),
          endsAt: toIsoOrNull(endsAt),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setReplaceError(data.error ?? 'Failed to replace discount.')
        return
      }

      setSavedMessage('Discount replaced successfully.')
      router.refresh()
    } catch {
      setReplaceError('Something went wrong. Please try again.')
    } finally {
      setSavingNew(false)
    }
  }

  async function handleUpdateCurrent(e: React.FormEvent) {
    e.preventDefault()
    setUpdatingCurrent(true)
    setUpdateError('')
    setSavedMessage('')

    try {
      const res = await fetch(`/api/admin/users/${userId}/discount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: currentIsActive,
          startsAt: toIsoOrNull(currentStartsAt),
          endsAt: toIsoOrNull(currentEndsAt),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setUpdateError(data.error ?? 'Failed to update discount.')
        return
      }

      setSavedMessage('Discount updated successfully.')
      router.refresh()
    } catch {
      setUpdateError('Something went wrong. Please try again.')
    } finally {
      setUpdatingCurrent(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {savedMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {savedMessage}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Current Discount</p>
            {discount ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={badgeVariant(discount.status)}>{discount.status}</Badge>
                <span className="text-sm text-gray-700">{formatDiscountLabel(discount)}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No discount assigned yet.</p>
            )}
          </div>
          {discount && (
            <div className="text-sm text-gray-500">
              <p>Starts: {discount.startsAt ? new Date(discount.startsAt).toLocaleString('en-GH') : 'Immediately'}</p>
              <p>Ends: {discount.endsAt ? new Date(discount.endsAt).toLocaleString('en-GH') : 'No expiry'}</p>
            </div>
          )}
        </div>
      </div>

      {discount && (
        <form onSubmit={handleUpdateCurrent} className="flex flex-col gap-4 rounded-lg border border-gray-200 px-4 py-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Update Current Discount</h4>
            <p className="mt-1 text-sm text-gray-500">
              Adjust activation and schedule only. Type and value stay immutable for history.
            </p>
          </div>

          {updateError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {updateError}
            </div>
          )}

          <label className="flex items-start gap-3 rounded-md border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={currentIsActive}
              onChange={(e) => setCurrentIsActive(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              <strong className="text-gray-900">Active discount</strong>
              <span className="mt-0.5 block text-xs text-gray-500">
                Only one active discount is allowed per user.
              </span>
            </span>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Starts At"
              type="datetime-local"
              value={currentStartsAt}
              onChange={(e) => setCurrentStartsAt(e.target.value)}
            />
            <Input
              label="Ends At"
              type="datetime-local"
              value={currentEndsAt}
              onChange={(e) => setCurrentEndsAt(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={updatingCurrent}>
              Save Discount Schedule
            </Button>
          </div>
        </form>
      )}

      <form onSubmit={handleReplace} className="flex flex-col gap-4 rounded-lg border border-gray-200 px-4 py-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            {discount ? 'Replace Discount' : 'Create Discount'}
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            Replacing creates a new record and deactivates the current active discount.
          </p>
        </div>

        {replaceError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {replaceError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="discount-type" className="text-sm font-medium text-gray-700">
              Discount Type
            </label>
            <select
              id="discount-type"
              value={type}
              onChange={(e) => setType(e.target.value as DiscountType)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <Input
            label={type === 'percentage' ? 'Discount Value (%)' : 'Discount Value (GHS)'}
            type="number"
            min="0.01"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            hint={
              type === 'percentage'
                ? 'Must be greater than 0 and less than 100.'
                : 'Must be greater than 0 and lower than the bundle price at purchase time.'
            }
          />
        </div>

        <label className="flex items-start gap-3 rounded-md border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            <strong className="text-gray-900">Activate immediately</strong>
            <span className="mt-0.5 block text-xs text-gray-500">
              Leave checked to make this the user&apos;s active discount.
            </span>
          </span>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Starts At"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
          <Input
            label="Ends At"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={savingNew}>
            {discount ? 'Replace Discount' : 'Create Discount'}
          </Button>
        </div>
      </form>

      {history.length > 0 && (
        <div className="rounded-lg border border-gray-200">
          <div className="border-b border-gray-100 px-4 py-3">
            <h4 className="text-sm font-semibold text-gray-900">Discount History</h4>
          </div>
          <div className="divide-y divide-gray-100">
            {history.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 px-4 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={badgeVariant(item.status)}>{item.status}</Badge>
                    <span className="font-medium text-gray-900">{formatDiscountLabel(item)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Created {new Date(item.createdAt).toLocaleString('en-GH')}
                  </p>
                </div>
                <div className="text-xs text-gray-500 sm:text-right">
                  <p>Starts: {item.startsAt ? new Date(item.startsAt).toLocaleString('en-GH') : 'Immediately'}</p>
                  <p>Ends: {item.endsAt ? new Date(item.endsAt).toLocaleString('en-GH') : 'No expiry'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
