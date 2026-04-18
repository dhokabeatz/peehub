import { NextRequest, NextResponse } from 'next/server'
import { bundleService } from '@/services/bundle.service'

// GET /api/networks/[code]/bundles
// Public — no auth required. Returns active bundles for a given network code.
// Example: GET /api/networks/MTN/bundles
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params

  try {
    const result = await bundleService.getNetworkWithBundles(code.toUpperCase())

    if (!result) {
      return NextResponse.json({ error: 'Network not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 })
  }
}
