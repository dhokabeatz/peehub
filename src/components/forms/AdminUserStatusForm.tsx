'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface AdminUserStatusFormProps {
  userId: string
  isActive: boolean
  isSelf: boolean
}

export function AdminUserStatusForm({ userId, isActive, isSelf }: AdminUserStatusFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const nextIsActive = !isActive

  async function handleToggle() {
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextIsActive }),
      })

      const data = await res.json()

      if (res.ok) {
        setSaved(true)
        router.refresh()
        return
      }

      setError(data.error ?? 'Failed to update user status.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm text-green-700">
          User status updated successfully.
        </div>
      )}

      {isSelf && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-800">
          You cannot deactivate your own admin account.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="button"
        variant={isActive ? 'danger' : 'primary'}
        loading={loading}
        onClick={handleToggle}
        disabled={isSelf && isActive}
      >
        {isActive ? 'Suspend User' : 'Activate User'}
      </Button>
    </div>
  )
}
