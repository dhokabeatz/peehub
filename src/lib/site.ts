import { brand } from '@/lib/brand'

function normalizeUrl(value?: string) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function getAppUrl() {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeUrl(process.env.PRODUCTION_URL) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : brand.appUrl)
  )
}

export function getDevelopmentUrl() {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_DEV_APP_URL) ??
    normalizeUrl(process.env.DEVELOPMENT_URL) ??
    brand.devAppUrl
  )
}

export function absoluteUrl(path = '/') {
  const base = getAppUrl().replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
