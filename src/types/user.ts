export type UserRole = 'retail' | 'agent' | 'admin'

export interface SessionUser {
  id: string
  role: string
}

export interface UserProfile {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  role: UserRole
  isActive: boolean
}
