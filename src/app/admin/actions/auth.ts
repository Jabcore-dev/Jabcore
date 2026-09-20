'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { adminUsers } from '@/db/schema'
import { verifyPassword } from '@/lib/auth/password'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  type SessionPayload,
} from '@/lib/auth/session'
import { IS_PRODUCTION } from '@/lib/site-config'

export interface LoginState {
  error?: string
}

/**
 * Signs in and redirects.
 *
 * The error is deliberately the same for an unknown address and a wrong
 * password: telling them apart turns the login form into a way to find out
 * which addresses have accounts.
 */
export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/admin')

  if (!email || !password) {
    return { error: 'Vyplň e-mail i heslo.' }
  }

  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1)

  /*
   * Hash a throwaway password when the account does not exist, so a missing
   * account takes about as long as a wrong password. Without it the response
   * time alone says whether an address is registered.
   */
  const hash = user?.passwordHash ?? '$2a$12$0000000000000000000000000000000000000000000000000000'
  const ok = await verifyPassword(password, hash)

  if (!user || !ok) {
    return { error: 'Nesprávný e-mail nebo heslo.' }
  }

  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role === 'owner' ? 'owner' : 'editor',
  }

  const token = await createSessionToken(payload)

  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Off on a local http:// instance, or the cookie would never be stored.
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })

  await db
    .update(adminUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(adminUsers.id, user.id))

  // Only ever back into the panel: "next" comes from the URL, so without this
  // the login form would happily bounce someone to another site.
  redirect(next.startsWith('/admin') ? next : '/admin')
}

export async function signOut() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/admin/login')
}
