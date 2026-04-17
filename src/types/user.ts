// Shared user types used across services, API responses, and frontend.
// These are plain data shapes — no Prisma types leak out of repositories.

export type UserRole = 'retail' | 'reseller' | 'admin'
export type AuthProvider = 'local' | 'cognito'

export interface UserProfile {
  id: string
  email: string | null
  phone: string | null
  fullName: string
  role: UserRole
  isActive: boolean
  authProvider: AuthProvider
  createdAt: Date
}

// Subset returned in auth responses (no createdAt, no authProvider)
export interface AuthUserPublic {
  id: string
  email: string | null
  phone: string | null
  fullName: string
  role: UserRole
}
