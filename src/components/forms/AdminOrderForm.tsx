'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { OrderStatus } from '@/types/order'

// Valid transitions per current status — mirrors service layer logic
const VALID_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending:    ['processing', 'cancelled'],
  processing: ['completed', 'failed', 'cancelled'],
  completed:  [],
  failed:     [],
  cancelled:  [],
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

interface AdminOrderFormProps {
  orderId: string
  currentStatus: OrderStatus
  currentAdminNote?: string | null
  currentProviderRef?: string | null
  onSuccess?: (updatedOrder: unknown) => void
}

export function AdminOrderForm({
  orderId,
  currentStatus,
  currentAdminNote,
  currentProviderRef,
  onSuccess,
}: AdminOrderFormProps) {
  const router = useRouter()
  const validNextStatuses = VALID_NEXT[currentStatus]
  const isTerminal = validNextStatuses.length === 0

  const [status, setStatus] = useState<OrderStatus>(validNextStatuses[0] ?? currentStatus)
  const [adminNote, setAdminNote] = useState(currentAdminNote ?? '')
  const [providerReference, setProviderReference] = useState(currentProviderRef ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  if (isTerminal) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500">
        This order is in a terminal state (<strong>{STATUS_LABELS[currentStatus]}</strong>) and
        cannot be updated further.
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...(adminNote.trim() ? { adminNote: adminNote.trim() } : {}),
          ...(providerReference.trim() ? { providerReference: providerReference.trim() } : {}),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSaved(true)
        onSuccess?.(data.order)
        router.refresh()
        return
      }

      if (res.status === 422 && data.from) {
        setError(`Invalid transition: ${data.from} → ${data.to}. ${data.error}`)
      } else {
        setError(data.error ?? 'Failed to update order. Please try again.')
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
          Order updated successfully.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as OrderStatus); setSaved(false) }}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {validNextStatuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          Current: <strong>{STATUS_LABELS[currentStatus]}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Admin Note <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={adminNote}
          onChange={(e) => { setAdminNote(e.target.value); setSaved(false) }}
          rows={3}
          maxLength={500}
          placeholder="e.g. Bundle sent at 10:15am via MTN portal"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <Input
        label="Provider Reference"
        hint="Optional — transaction ID from the provider portal"
        type="text"
        placeholder="e.g. MTN-TXN-123456"
        value={providerReference}
        onChange={(e) => { setProviderReference(e.target.value); setSaved(false) }}
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading}>
        Save Changes
      </Button>
    </form>
  )
}
