import bcrypt from 'bcryptjs'

/**
 * Password hashing.
 *
 * bcryptjs, not argon2: argon2 bindings are native, and getting a .node binary
 * traced into a Next standalone build on Alpine is a deploy-time failure
 * waiting to happen. This is a handful of accounts logging in a few times a
 * day, where pure JS costs about a tenth of a second and nothing else.
 */

// 12 rounds ≈ 100 ms on the server. High enough to be worth attacking nobody,
// low enough that a login does not feel stuck.
const ROUNDS = 12

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/** Shared with the client-side form so both sides reject the same passwords. */
export const MIN_PASSWORD_LENGTH = 10
