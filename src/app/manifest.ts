import type { MetadataRoute } from 'next'
import { brand } from '@/lib/brand'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.appName,
    short_name: brand.shortAppName,
    description: brand.seoDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    icons: brand.faviconPath
      ? [
          {
            src: brand.faviconPath,
            sizes: 'any',
            type: 'image/png',
          },
        ]
      : [],
  }
}
