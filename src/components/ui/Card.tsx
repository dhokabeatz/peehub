import React from 'react'

interface CardProps {
  children: React.ReactNode
  title?: string
  description?: string
  className?: string
  footer?: React.ReactNode
}

export function Card({ children, title, description, className = '', footer }: CardProps) {
  return (
    <div
      className={[
        'bg-white border border-gray-200 rounded-lg shadow-sm',
        className,
      ].join(' ')}
    >
      {(title || description) && (
        <div className="px-5 py-4 border-b border-gray-100">
          {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  )
}
