'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserProfile } from '@/types/user'
import { Footer } from '@/components/layout/Footer'
import { brand } from '@/lib/brand'

const adminNavLinks = [
  { href: '/admin', label: 'Dashboard', icon: GridIcon },
  { href: '/admin/bundles', label: 'Bundles', icon: LayersIcon },
  { href: '/admin/users', label: 'Users', icon: UsersIcon },
  { href: '/admin/orders', label: 'Orders',  icon: ListIcon   },
  { href: '/admin/wallet', label: 'Wallet',  icon: WalletIcon },
]

interface AdminShellProps {
  user: { fullName: string; role: string }
  children: React.ReactNode
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    // Hard navigation clears the Next.js router segment cache so that a
    // subsequent login renders a completely fresh layout with the new user.
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 h-full w-64 bg-slate-900 text-slate-300 flex flex-col z-30',
          'transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static',
        ].join(' ')}
      >
        <div className="px-5 py-5 border-b border-slate-800">
          <span className="text-white font-bold text-lg tracking-tight">{brand.shortAppName}</span>
          <span className="ml-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">
            Admin
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {adminNavLinks.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/admin'
                ? pathname === '/admin'
                : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={[
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                ].join(' ')}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-slate-400 hover:text-white transition-colors px-1"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Open menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900">Admin</span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" />
    </svg>
  )
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l8 4-8 4-8-4 8-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l8 4 8-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l8 4 8-4" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7a4 4 0 100-8 4 4 0 000 8z" transform="translate(3 5)" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}
