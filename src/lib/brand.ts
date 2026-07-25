function readPublicEnv(name: string, fallback?: string) {
  const value = process.env[name]?.trim()
  if (value) return value
  return fallback
}

function normalizeUrl(value?: string) {
  if (!value) return undefined
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

function splitKeywords(value?: string) {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export const brand = {
  appName: readPublicEnv('NEXT_PUBLIC_APP_NAME', 'Xpress Data Bundles')!,
  shortAppName: readPublicEnv('NEXT_PUBLIC_SHORT_APP_NAME', 'BMB Xpress')!,
  businessOwner: readPublicEnv('NEXT_PUBLIC_BUSINESS_OWNER', 'Bigem Ballas')!,
  copyrightName:
    readPublicEnv('NEXT_PUBLIC_COPYRIGHT_NAME') ??
    readPublicEnv('NEXT_PUBLIC_BUSINESS_OWNER', 'Bigem Ballas')!,
  softwareBuilder: readPublicEnv('NEXT_PUBLIC_SOFTWARE_BUILDER', 'HDO Labs')!,
  appUrl:
    normalizeUrl(readPublicEnv('NEXT_PUBLIC_APP_URL')) ??
    normalizeUrl(process.env.PRODUCTION_URL?.trim()) ??
    'http://localhost:3000',
  devAppUrl:
    normalizeUrl(readPublicEnv('NEXT_PUBLIC_DEV_APP_URL')) ??
    normalizeUrl(process.env.DEVELOPMENT_URL?.trim()),
  productionDomain:
    readPublicEnv('NEXT_PUBLIC_PRODUCTION_DOMAIN') ??
    process.env.PRODUCTION_DOMAIN?.trim(),
  developmentDomain:
    readPublicEnv('NEXT_PUBLIC_DEVELOPMENT_DOMAIN') ??
    process.env.DEVELOPMENT_DOMAIN?.trim(),
  supportEmail: readPublicEnv('NEXT_PUBLIC_SUPPORT_EMAIL'),
  supportPhone: readPublicEnv('NEXT_PUBLIC_SUPPORT_PHONE'),
  whatsappNumber: readPublicEnv('NEXT_PUBLIC_WHATSAPP_NUMBER'),
  businessAddress: readPublicEnv('NEXT_PUBLIC_BUSINESS_ADDRESS'),
  businessHours: readPublicEnv('NEXT_PUBLIC_BUSINESS_HOURS'),
  xUrl: normalizeUrl(readPublicEnv('NEXT_PUBLIC_X_URL')),
  facebookUrl: normalizeUrl(readPublicEnv('NEXT_PUBLIC_FACEBOOK_URL')),
  instagramUrl: normalizeUrl(readPublicEnv('NEXT_PUBLIC_INSTAGRAM_URL')),
  tiktokUrl: normalizeUrl(readPublicEnv('NEXT_PUBLIC_TIKTOK_URL')),
  seoDescription:
    readPublicEnv('NEXT_PUBLIC_SEO_DESCRIPTION') ??
    'Fast and reliable data bundles from Bigem Ballas.',
  seoKeywords: splitKeywords(readPublicEnv('NEXT_PUBLIC_SEO_KEYWORDS')),
  openGraphImage:
    normalizeUrl(readPublicEnv('NEXT_PUBLIC_OPEN_GRAPH_IMAGE_URL')) ??
    readPublicEnv('NEXT_PUBLIC_OPEN_GRAPH_IMAGE_PATH'),
  logoPath: readPublicEnv('NEXT_PUBLIC_LOGO_PATH'),
  faviconPath: readPublicEnv('NEXT_PUBLIC_FAVICON_PATH'),
} as const

export function formatPageTitle(title?: string, options?: { admin?: boolean }) {
  const parts = [brand.shortAppName]

  if (options?.admin) parts.push('Admin')
  if (title) parts.push(title)

  return parts.join(' | ')
}

export function formatPoweredBy() {
  return `Powered by ${brand.softwareBuilder}`
}

export function formatCopyright(year = new Date().getFullYear()) {
  return `© ${year} ${brand.copyrightName}. All rights reserved.`
}
