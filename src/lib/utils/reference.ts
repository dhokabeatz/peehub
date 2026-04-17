import { randomBytes } from 'crypto'

/**
 * Generates a unique reference string for wallet transactions and payments.
 * Format: PHB-{timestamp}-{6 random hex chars}
 * Example: PHB-1713100800000-a3f9c1
 */
export function generateReference(prefix = 'PHB'): string {
  const timestamp = Date.now()
  const random = randomBytes(3).toString('hex')
  return `${prefix}-${timestamp}-${random}`
}
