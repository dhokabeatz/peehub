import type { Metadata } from 'next'
import { brand, formatPageTitle } from '@/lib/brand'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(brand.appUrl),
  title: {
    default: `${brand.shortAppName} | Fast and Reliable Data Bundles`,
    template: `%s`,
  },
  applicationName: brand.appName,
  description: brand.seoDescription,
  keywords: brand.seoKeywords,
  openGraph: {
    title: `${brand.shortAppName} | Fast and Reliable Data Bundles`,
    description: brand.seoDescription,
    url: brand.appUrl,
    siteName: brand.appName,
    type: 'website',
    images: brand.openGraphImage ? [{ url: brand.openGraphImage }] : undefined,
  },
  twitter: {
    card: brand.openGraphImage ? 'summary_large_image' : 'summary',
    title: formatPageTitle('Fast and Reliable Data Bundles'),
    description: brand.seoDescription,
    images: brand.openGraphImage ? [brand.openGraphImage] : undefined,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
