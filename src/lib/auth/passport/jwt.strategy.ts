import { Strategy as PassportJwtStrategy, ExtractJwt } from 'passport-jwt'
import { verifyAccessToken } from '../token'

// Used in non-edge contexts (tests, standalone Node scripts).
// Edge middleware uses verifyAccessToken() from token.ts directly via jose.
// ExtractJwt.fromAuthHeaderAsBearerToken() also supports API clients.

export const jwtStrategy = new PassportJwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
  },
  async (payload, done) => {
    try {
      // payload is already verified by passport-jwt; re-shape to TokenPayload
      const tokenPayload = await verifyAccessToken(
        // passport-jwt decodes for us — just pass the raw payload fields
        // This path is primarily for test environments; edge uses token.ts directly
        '' as string, // unused — passport-jwt already verified
      ).catch(() => ({ sub: payload.sub as string, role: payload.role as string }))
      return done(null, tokenPayload)
    } catch (err) {
      return done(err, false)
    }
  },
)
