'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE } from '@/lib/auth/session'
import { endSessionUrl } from '@/lib/auth/oidc'

/**
 * Ends the panel session and the Jabcore Platform one with it - otherwise the
 * next "Přihlásit" would go straight back in without asking. The platform then
 * returns the browser to /admin, i.e. the login screen.
 */
export async function signOut() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect((await endSessionUrl()) ?? '/admin/login')
}
