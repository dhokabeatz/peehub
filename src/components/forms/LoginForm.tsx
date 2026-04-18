'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })

      if (res.ok) {
        router.push('/dashboard')
        return
      }

      const data = await res.json()
      setError(data.error ?? 'Login failed. Please try again.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Email or Phone"
        type="text"
        placeholder="you@example.com or 024..."
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
        autoComplete="username"
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full mt-1">
        Sign in
      </Button>

      <p className="text-sm text-center text-gray-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          Create one
        </Link>
      </p>
    </form>
  )
}
