import { SignJWT } from 'jose/jwt/sign'
import { jwtVerify } from 'jose/jwt/verify'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export interface TokenPayload {
  sub: string  // userId
  role: string
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_EXPIRES_IN ?? '15m')
    .sign(secret)
}

// Used by edge middleware (jose is Web Crypto compatible — runs in Edge runtime).
// Also imported by passport/jwt.strategy.ts for non-edge contexts.
export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, secret)
  return {
    sub: payload.sub as string,
    role: payload.role as string,
  }
}
