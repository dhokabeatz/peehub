import { Strategy as PassportLocalStrategy } from 'passport-local'
import { localAuthProvider } from '../local.provider'

// Validates email-or-phone + password via the IAuthProvider.
// Only used in Node.js route handlers (not edge middleware).
// The `usernameField: 'identifier'` maps to the request body field name.

export const localStrategy = new PassportLocalStrategy(
  { usernameField: 'identifier', passwordField: 'password' },
  async (identifier, password, done) => {
    try {
      const user = await localAuthProvider.validateCredentials(identifier, password)
      if (!user) return done(null, false, { message: 'Invalid credentials' })
      if (!user.isActive) return done(null, false, { message: 'Account is deactivated' })
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  },
)
