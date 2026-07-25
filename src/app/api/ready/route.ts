import { NextResponse } from 'next/server'
import { readinessService } from '@/services/readiness.service'

export async function GET() {
  const readiness = await readinessService.check()

  if (readiness.status === 'ready') {
    return NextResponse.json(readiness)
  }

  return NextResponse.json(
    {
      status: 'not_ready',
      database: readiness.database,
      schema: readiness.schema,
      environment: readiness.environment,
    },
    { status: 503 },
  )
}
