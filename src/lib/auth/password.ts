import bcrypt from 'bcryptjs'

// Cost factor 12 — ~300ms on modern hardware. Balances security vs latency.
const SALT_ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
