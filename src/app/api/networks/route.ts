import { NextResponse } from 'next/server'
import { bundleService } from '@/services/bundle.service'

// GET /api/networks
// Public — no auth required. Returns all active networks.
export async function GET() {
  try {
    const networks = await bundleService.getNetworks()
    return NextResponse.json({ networks })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch networks' }, { status: 500 })
  }
}
