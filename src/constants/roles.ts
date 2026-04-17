export const ROLES = {
  RETAIL: 'retail',
  RESELLER: 'reseller',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
