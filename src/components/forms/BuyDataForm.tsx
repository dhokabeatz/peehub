'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { detectNetwork } from '@/lib/utils/phone'

interface Network {
  id: string
  name: string
  code: string
}

interface Bundle {
  id: string
  name: string
  dataSizeMb: number
  validityDays: number
  price: string
}

function formatMb(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

export function BuyDataForm() {
  const router = useRouter()

  const [networks, setNetworks] = useState<Network[]>([])
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null)
  const [phone, setPhone] = useState('')
  const [detectedCode, setDetectedCode] = useState<string | null>(null)

  const [loadingNetworks, setLoadingNetworks] = useState(true)
  const [loadingBundles, setLoadingBundles] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Fetch networks on mount
  useEffect(() => {
    fetch('/api/networks')
      .then((r) => r.json())
      .then(({ networks }) => setNetworks(networks ?? []))
      .catch(() => setNetworks([]))
      .finally(() => setLoadingNetworks(false))
  }, [])

  // Fetch bundles when a network is selected
  const fetchBundles = useCallback(async (networkCode: string) => {
    setLoadingBundles(true)
    setBundles([])
    setSelectedBundle(null)
    try {
      const res = await fetch(`/api/networks/${networkCode}/bundles`)
      if (res.ok) {
        const data = await res.json()
        setBundles(data.bundles ?? [])
      }
    } finally {
      setLoadingBundles(false)
    }
  }, [])

  function handleNetworkSelect(network: Network) {
    setSelectedNetwork(network)
    setSelectedBundle(null)
    fetchBundles(network.code)
  }

  // Auto-detect network from phone number
  function handlePhoneChange(value: string) {
    setPhone(value)
    const code = detectNetwork(value)
    setDetectedCode(code)

    if (code) {
      const match = networks.find((n) => n.code === code)
      if (match && match.code !== selectedNetwork?.code) {
        handleNetworkSelect(match)
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBundle || !phone) return
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId: selectedBundle.id, recipientPhone: phone }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/orders'), 2000)
        return
      }

      if (res.status === 402) {
        setError('Insufficient wallet balance. Please fund your wallet and try again.')
      } else if (res.status === 422 && data.detected) {
        setError(
          `Phone number belongs to ${data.detected}, but you selected a ${data.expected} bundle. Please match the network.`,
        )
      } else {
        setError(data.error ?? 'Failed to place order. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center flex flex-col items-center gap-2">
        <span className="text-4xl">✓</span>
        <p className="font-semibold text-green-800 text-lg">Order Placed!</p>
        <p className="text-sm text-green-700">Redirecting to your orders…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Phone — at top so network auto-detects as user types */}
      <div>
        <Input
          label="Recipient Phone Number"
          type="tel"
          placeholder="024 000 0000"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          required
          hint={
            detectedCode
              ? `Detected network: ${detectedCode}`
              : 'Enter phone number to auto-detect network'
          }
        />
      </div>

      {/* Network selection */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Network</p>
        {loadingNetworks ? (
          <p className="text-sm text-gray-400">Loading networks…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {networks.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleNetworkSelect(n)}
                className={[
                  'px-5 py-2 rounded-md border text-sm font-medium transition-colors',
                  selectedNetwork?.id === n.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                {n.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bundle selection */}
      {selectedNetwork && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {selectedNetwork.name} Bundles
          </p>

          {loadingBundles ? (
            <p className="text-sm text-gray-400">Loading bundles…</p>
          ) : bundles.length === 0 ? (
            <p className="text-sm text-gray-400">No bundles available for this network.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bundles.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBundle(b)}
                  className={[
                    'text-left px-4 py-3 rounded-md border transition-colors',
                    selectedBundle?.id === b.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50',
                  ].join(' ')}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatMb(b.dataSizeMb)} · {b.validityDays}d
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-blue-700 shrink-0 ml-3">
                      GHS {b.price}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {selectedBundle && phone && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900 mb-1">Order Summary</p>
          <p>Bundle: {selectedBundle.name} ({formatMb(selectedBundle.dataSizeMb)})</p>
          <p>Network: {selectedNetwork?.name}</p>
          <p>Recipient: {phone}</p>
          <p className="font-semibold mt-1">Total: GHS {selectedBundle.price}</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        loading={submitting}
        disabled={!selectedBundle || !phone}
        className="w-full"
      >
        Place Order
      </Button>
    </form>
  )
}
