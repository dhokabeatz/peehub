// Ghana mobile number prefix → network mapping.
// Used by LocalAuthProvider and OrderService for network detection.
// Prefixes sourced from NCA Ghana allocations.

export type NetworkCode = 'MTN' | 'TELECEL' | 'AIRTELTIGO'
export type IdentifierType = 'email' | 'phone'

const MTN_PREFIXES = ['024', '054', '055', '059', '025']
const TELECEL_PREFIXES = ['020', '050']
const AIRTELTIGO_PREFIXES = ['027', '057', '026', '056']

/**
 * Detects the Ghana network from a phone number.
 * Accepts formats: 0241234567, +233241234567, 233241234567
 * Returns null if the prefix is unrecognized.
 */
export function detectNetwork(phone: string): NetworkCode | null {
  const normalized = normalizePhone(phone)
  if (!normalized) return null

  const prefix = normalized.slice(0, 3) // e.g. '024'

  if (MTN_PREFIXES.includes(prefix)) return 'MTN'
  if (TELECEL_PREFIXES.includes(prefix)) return 'TELECEL'
  if (AIRTELTIGO_PREFIXES.includes(prefix)) return 'AIRTELTIGO'

  return null
}

/**
 * Normalizes a Ghana phone number to local format (0XXXXXXXXX).
 * Returns null if the input doesn't look like a Ghana number.
 */
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')

  if (digits.startsWith('233') && digits.length === 12) {
    return '0' + digits.slice(3)
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return digits
  }

  return null
}

/**
 * Detects whether an identifier is an email address or phone number.
 */
export function detectIdentifierType(identifier: string): IdentifierType {
  return identifier.includes('@') ? 'email' : 'phone'
}
