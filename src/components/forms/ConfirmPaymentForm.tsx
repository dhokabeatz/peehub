'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type ResultState =
  | { type: 'success';           reference: string; amount: string }
  | { type: 'already_confirmed'; reference: string }
  | { type: 'not_found' }
  | { type: 'already_failed' }
  | { type: 'error';             message: string }

interface ConfirmPaymentFormProps {
  /** Pre-fill the reference input (e.g. clicked from pending table) */
  initialReference?: string
  onConfirmed?: () => void
}

export function ConfirmPaymentForm({ initialReference = '', onConfirmed }: ConfirmPaymentFormProps) {
  const [reference, setReference] = useState(initialReference)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<ResultState | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    setLoading(true)

    try {
      const res  = await fetch('/api/admin/wallet/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reference: reference.trim() }),
      })

      const data = await res.json()

      if (res.status === 404) {
        setResult({ type: 'not_found' })
        return
      }

      if (res.status === 422) {
        // Already failed — cannot confirm
        setResult({ type: 'already_failed' })
        return
      }

      if (!res.ok) {
        setResult({ type: 'error', message: data.error ?? 'Something went wrong.' })
        return
      }

      // 200: either freshly confirmed or already confirmed
      if (data.paymentStatus === 'success') {
        setResult({ type: 'already_confirmed', reference: reference.trim() })
        return
      }

      setResult({
        type:      'success',
        reference: data.payment?.providerReference ?? reference.trim(),
        amount:    data.payment?.amount ?? '',
      })
      setReference('')
      onConfirmed?.()
    } catch {
      setResult({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Payment Reference"
        hint="Enter the PAY-... reference from the user's funding request"
        type="text"
        placeholder="PAY-XXXXXXXXXXXXXXXX"
        value={reference}
        onChange={(e) => { setReference(e.target.value); setResult(null) }}
        required
      />

      {result?.type === 'success' && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <p className="font-semibold">Payment confirmed</p>
          <p className="mt-0.5 text-green-700 font-mono text-xs">{result.reference}</p>
          {result.amount && (
            <p className="mt-1">GHS {result.amount} has been credited to the user&apos;s wallet.</p>
          )}
        </div>
      )}

      {result?.type === 'already_confirmed' && (
        <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          <p className="font-semibold">Already confirmed</p>
          <p className="mt-0.5 font-mono text-xs text-blue-700">{result.reference}</p>
          <p className="mt-1">This payment was previously confirmed. No action taken.</p>
        </div>
      )}

      {result?.type === 'not_found' && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          <p className="font-semibold">Reference not found</p>
          <p className="mt-1">No payment transaction matches this reference. Check for typos.</p>
        </div>
      )}

      {result?.type === 'already_failed' && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Payment already failed</p>
          <p className="mt-1">
            This payment has a failed status and cannot be confirmed. Manual intervention required.
          </p>
        </div>
      )}

      {result?.type === 'error' && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Error</p>
          <p className="mt-1">{result.message}</p>
        </div>
      )}

      <Button type="submit" loading={loading} disabled={!reference.trim()}>
        Confirm Payment
      </Button>
    </form>
  )
}
