import React from 'react'

interface AdminTableShellProps {
  children: React.ReactNode
}

export function AdminTableShell({ children }: AdminTableShellProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}
