'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type IdentifierMode = 'email' | 'phone'

export function RegisterForm() {
  const router = useRouter()
  const [mode, setMode] = useState<IdentifierMode>('phone')
  const [fullName, setFullName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const body =
      mode === 'email'
        ? { fullName, email: identifier, password }
        : { fullName, phone: identifier, password }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        router.push('/dashboard')
        return
      }

      const data = await res.json()
      if (data.issues) {
        setError(data.issues.map((i: { message: string }) => i.message).join(', '))
      } else {
        setError(data.error ?? 'Registration failed. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Full Name"
        type="text"
        placeholder="John Doe"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        autoComplete="name"
      />

      {/* Email / Phone toggle */}
      <div>
        <div className="flex rounded-md border border-gray-300 overflow-hidden mb-3">
          {(['phone', 'email'] as IdentifierMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setIdentifier('') }}
              className={[
                'flex-1 py-1.5 text-sm font-medium transition-colors',
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {m === 'phone' ? 'Phone Number' : 'Email'}
            </button>
          ))}
        </div>

        {mode === 'phone' ? (
          <Input
            label="Phone Number"
            type="tel"
            placeholder="024 000 0000"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="tel"
          />
        ) : (
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="email"
          />
        )}
      </div>

      <Input
        label="Password"
        type="password"
        placeholder="Min. 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full mt-1">
        Create Account
      </Button>

      <p className="text-sm text-center text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
