import React from 'react'

interface AdminPageHeaderProps {
  title: string
  description: string
  meta?: string
  actions?: React.ReactNode
}

export function AdminPageHeader({
  title,
  description,
  meta,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        {meta && <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">{meta}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
