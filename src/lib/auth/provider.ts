// IAuthProvider — the single interface both local and Cognito providers implement.
// auth.service.ts depends only on this interface, never on a concrete class.
// Swapping providers = changing AUTH_PROVIDER env var + wiring the concrete class.

export interface AuthUser {
  id: string
  email: string | null
  phone: string | null
  fullName: string
  role: string
  isActive: boolean
}

export interface CreateUserInput {
  fullName: string
  email?: string
  phone?: string
  password: string
}

export interface IAuthProvider {
  // Validates email-or-phone identifier + password. Returns null on failure.
  validateCredentials(identifier: string, password: string): Promise<AuthUser | null>
  createUser(data: CreateUserInput): Promise<AuthUser>
}
