import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/login'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/register'), changeFrequency: 'monthly', priority: 0.7 },
  ]
}
