import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, readSessionToken, type SessionPayload } from './session'

/**
 * Who is signed in, or null.
 *
 * Middleware already keeps anonymous visitors out of /admin, but it only sees
 * the cookie. Every page and every server action checks again here, because a
 * server action is reachable by POST regardless of which page the caller came
 * from - the middleware check is a redirect for humans, not authorisation.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return readSessionToken(token)
}

/** For admin pages: sends anonymous visitors to the login screen. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect('/admin/login')
  return session
}

/**
 * For server actions. Throws instead of redirecting: an action has no page to
 * send anyone to, and a redirect there would look like success to the caller.
 */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) throw new Error('Nepřihlášen.')
  return session
}

/** Managing other accounts is limited to owners. */
export async function requireOwner(): Promise<SessionPayload> {
  const session = await requireUser()
  if (session.role !== 'owner') throw new Error('Tahle akce je jen pro vlastníky účtu.')
  return session
}
