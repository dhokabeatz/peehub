'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { FundWalletResult } from '@/types/wallet'

const PRESET_AMOUNTS = [10, 20, 50, 100, 200]

export function FundWalletForm() {
  const [amount, setAmount]           = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [result, setResult]           = useState<FundWalletResult | null>(null)

  // ── Paystack redirect ───────────────────────────────────────────────────────
  // When the API returns an authorization_url, show a brief loading state then
  // redirect. Doing this in a useEffect ensures the state update has rendered
  // (so the user sees "Redirecting…") before the navigation fires.
  useEffect(() => {
    if (result?.authorization_url) {
      setRedirecting(true)
      window.location.href = result.authorization_url
    }
  }, [result])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed < 1) {
      setError('Minimum top-up amount is GHS 1.')
      return
    }
    if (parsed > 10000) {
      setError('Maximum top-up amount is GHS 10,000.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed }),
      })

      const data = await res.json() as FundWalletResult & { error?: string; issues?: Array<{ message: string }> }

      if (res.ok) {
        setResult(data)
        return
      }

      if (data.issues) {
        setError(data.issues.map((i) => i.message).join(', '))
      } else {
        setError(data.error ?? 'Failed to initiate top-up. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Paystack redirect loading screen ─────────────────────────────────────────
  if (redirecting || (result?.authorization_url && !error)) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-600 font-medium">Redirecting to Paystack checkout…</p>
        <p className="text-xs text-gray-400">Please do not close this page.</p>
      </div>
    )
  }

  // ── Manual top-up success screen ─────────────────────────────────────────────
  if (result && !result.authorization_url) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-lg">✓</span>
            <p className="font-semibold text-green-800">Top-up Initiated</p>
          </div>
          <p className="text-sm text-green-700">
            Amount: <strong>GHS {parseFloat(result.amount).toFixed(2)}</strong>
          </p>
          <p className="text-sm text-green-700">
            Reference: <strong className="font-mono">{result.reference}</strong>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">Next step</p>
          <p>
            Share your reference code with the admin to confirm your payment. Your wallet will
            be credited once the payment is verified.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => { setResult(null); setAmount('') }}
        >
          Make Another Top-up
        </Button>
      </div>
    )
  }

  // ── Fund form ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Preset amounts */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Quick amounts (GHS)</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={[
                'px-4 py-2 rounded-md border text-sm font-medium transition-colors',
                amount === String(preset)
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Amount (GHS)"
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="1"
        max="10000"
        step="0.01"
        required
        hint="Minimum: GHS 1 · Maximum: GHS 10,000"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {loading ? 'Processing…' : 'Fund Wallet'}
      </Button>
    </form>
  )
}
