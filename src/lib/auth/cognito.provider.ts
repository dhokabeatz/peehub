import type { IAuthProvider, AuthUser, CreateUserInput } from './provider'

// Stub for future AWS Cognito migration.
// Swap AUTH_PROVIDER=cognito + wire this class to activate.
// No bcrypt — Cognito manages password hashing internally.

export class CognitoAuthProvider implements IAuthProvider {
  async validateCredentials(_identifier: string, _password: string): Promise<AuthUser | null> {
    // TODO: Cognito migration
    // 1. Call cognito.initiateAuth({ AuthFlow: 'USER_PASSWORD_AUTH', ... })
    // 2. On success, fetch user record from local DB by cognitoSub
    // 3. Return AuthUser or null
    throw new Error('Cognito provider not yet implemented')
  }

  async createUser(_data: CreateUserInput): Promise<AuthUser> {
    // TODO: Cognito migration
    // 1. Call cognito.signUp({ Username, Password, UserAttributes })
    // 2. Insert user row with cognitoSub + authProvider=cognito (no passwordHash)
    // 3. Auto-create wallet in the same transaction
    throw new Error('Cognito provider not yet implemented')
  }
}

export const cognitoAuthProvider = new CognitoAuthProvider()
