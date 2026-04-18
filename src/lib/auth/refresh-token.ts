import { randomBytes, createHash } from 'crypto'
import { db } from '@/lib/db'

const EXPIRES_DAYS = 30

// SHA-256 is deterministic — allows DB lookup by hash without bcrypt's randomness.
// Safe for opaque tokens because the tokens themselves are 32 random bytes (256-bit entropy).
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function refreshTokenExpiry(): Date {
  const d = new Date()
  d.setDate(d.getDate() + EXPIRES_DAYS)
  return d
}

// Generate a new refresh token, persist its hash, and return the raw token to send to client.
export async function createRefreshToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString('hex')
  await db.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256(rawToken),
      expiresAt: refreshTokenExpiry(),
    },
  })
  return rawToken
}

// Validate incoming token, revoke it, and issue a new one (rotation).
// Returns null if the token is unknown, expired, or already revoked.
export async function rotateRefreshToken(
  rawToken: string,
): Promise<{ newRawToken: string; userId: string } | null> {
  const tokenHash = sha256(rawToken)

  const record = await db.refreshToken.findUnique({ where: { tokenHash } })

  if (!record || record.revoked || record.expiresAt < new Date()) {
    return null
  }

  const newRawToken = randomBytes(32).toString('hex')

  await db.$transaction([
    db.refreshToken.update({ where: { id: record.id }, data: { revoked: true } }),
    db.refreshToken.create({
      data: {
        userId: record.userId,
        tokenHash: sha256(newRawToken),
        expiresAt: refreshTokenExpiry(),
      },
    }),
  ])

  return { newRawToken, userId: record.userId }
}

// Revoke a single token on logout. Best-effort — does not throw if not found.
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = sha256(rawToken)
  await db.refreshToken.updateMany({
    where: { tokenHash, revoked: false },
    data: { revoked: true },
  })
}
