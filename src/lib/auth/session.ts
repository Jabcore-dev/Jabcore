import { SignJWT, jwtVerify } from 'jose'
import type { AdminRole } from '@/db/schema'

/**
 * Admin sessions.
 *
 * A signed JWT in an httpOnly cookie, rather than a session table: there is no
 * server-side state to clean up, and middleware can check it without touching
 * the database on every request. The trade-off is that a session cannot be
 * revoked before it expires — acceptable for a two-week window on a panel with
 * a handful of accounts, and rotating AUTH_SECRET invalidates all of them.
 *
 * jose and not jsonwebtoken because this also has to run in middleware, which
 * uses the edge runtime and has no Node crypto.
 */

export const SESSION_COOKIE = 'jabcore_admin'
const ISSUER = 'jabcore-admin'

/** Two weeks — long enough not to annoy, short enough to bound a leaked cookie. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14

export interface SessionPayload {
  userId: number
  email: string
  name: string | null
  role: AdminRole
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET

  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET chybí nebo je kratší než 32 znaků. Vygeneruj: openssl rand -hex 32',
    )
  }

  return new TextEncoder().encode(secret)
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

/** Returns null for anything that is not a valid, unexpired session. */
export async function readSessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER })

    // A token can be correctly signed and still not describe a user — for
    // instance one issued by an older version of this payload.
    if (typeof payload.userId !== 'number' || typeof payload.email !== 'string') return null

    return {
      userId: payload.userId,
      email: payload.email,
      name: (payload.name as string | null) ?? null,
      role: (payload.role as AdminRole) ?? 'editor',
    }
  } catch {
    return null
  }
}
