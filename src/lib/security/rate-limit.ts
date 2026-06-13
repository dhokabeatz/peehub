import type { NextRequest } from 'next/server'

type RateLimitBucket = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitBucket>()

/**
 * First-pass in-memory rate limiter for release hardening.
 *
 * Important:
 * - This is process-local and NOT distributed-safe on serverless/multi-instance deployments.
 * - Replace with Redis / KV-backed coordination for stronger production enforcement later.
 */
export function consumeRateLimit(input: {
  bucket: string
  key: string
  limit: number
  windowMs: number
}) {
  const now = Date.now()
  const storeKey = `${input.bucket}:${input.key}`
  const current = rateLimitStore.get(storeKey)

  if (!current || current.resetAt <= now) {
    const next: RateLimitBucket = {
      count: 1,
      resetAt: now + input.windowMs,
    }
    rateLimitStore.set(storeKey, next)
    return {
      allowed: true,
      remaining: input.limit - 1,
      retryAfterSeconds: Math.ceil(input.windowMs / 1000),
    }
  }

  if (current.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  rateLimitStore.set(storeKey, current)
  return {
    allowed: true,
    remaining: input.limit - current.count,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}

export function getRequestIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}
