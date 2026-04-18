import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PeeHub',
  description: 'Buy data bundles easily across all networks',
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
