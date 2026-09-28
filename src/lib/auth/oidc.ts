import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { SITE_URL } from '@/lib/site-config'

/**
 * Sign-in through Jabcore Platform (Zitadel).
 *
 * The platform owns passwords, MFA and "forgot password"; this app only learns
 * a verified e-mail. The OIDC application there is a public client, so the flow
 * is Authorization Code + PKCE with no client secret. Which e-mails may open
 * the panel, and with which role, is still admin_users - anyone can register an
 * account in the platform's user pool, so a valid login alone proves nothing.
 *
 * Redirect URI and Post Logout URI must match the instance registered in the
 * platform admin exactly: <SITE_URL>/admin/callback and <SITE_URL>/admin.
 */

export const OIDC_ISSUER = (process.env.OIDC_ISSUER ?? 'https://zitadel.auth.jabcore.cloud').replace(
  /\/+$/,
  '',
)
export const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID ?? ''

export const CALLBACK_URL = `${SITE_URL}/admin/callback`
export const POST_LOGOUT_URL = `${SITE_URL}/admin`

/** Short-lived cookie holding state, nonce, PKCE verifier and where to return. */
export const FLOW_COOKIE = 'jabcore_admin_oidc'
export const FLOW_MAX_AGE_SECONDS = 10 * 60

export interface LoginFlow {
  state: string
  nonce: string
  verifier: string
  next: string
}

interface Discovery {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  jwks_uri: string
  end_session_endpoint?: string
}

let discovery: Promise<Discovery & { jwks: ReturnType<typeof createRemoteJWKSet> }> | null = null

/** Cached for the life of the process; a failed fetch is retried next time. */
function discover() {
  discovery ??= (async () => {
    const response = await fetch(`${OIDC_ISSUER}/.well-known/openid-configuration`, {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`OIDC discovery failed with HTTP ${response.status}`)
    const document = (await response.json()) as Discovery
    return { ...document, jwks: createRemoteJWKSet(new URL(document.jwks_uri)) }
  })().catch((error) => {
    discovery = null
    throw error
  })
  return discovery
}

export function isOidcConfigured(): boolean {
  return OIDC_CLIENT_ID !== ''
}

/** Only ever back into the panel - "next" comes from the URL. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin'
}

export async function startLogin(next: string): Promise<{ url: string; flow: LoginFlow }> {
  const oidc = await discover()
  const flow: LoginFlow = {
    state: randomBytes(32).toString('base64url'),
    nonce: randomBytes(32).toString('base64url'),
    verifier: randomBytes(32).toString('base64url'),
    next: safeNext(next),
  }

  const url = new URL(oidc.authorization_endpoint)
  url.search = new URLSearchParams({
    client_id: OIDC_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: createHash('sha256').update(flow.verifier).digest('base64url'),
    code_challenge_method: 'S256',
  }).toString()

  return { url: url.toString(), flow }
}

export interface Identity {
  email: string
  name: string | null
}

/** Exchanges the code and returns the verified identity, or throws. */
export async function finishLogin(code: string, flow: LoginFlow): Promise<Identity> {
  const oidc = await discover()

  const response = await fetch(oidc.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: OIDC_CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      code_verifier: flow.verifier,
    }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`OIDC token exchange failed with HTTP ${response.status}`)

  const { id_token: idToken } = (await response.json()) as { id_token?: string }
  if (!idToken) throw new Error('Token response has no id_token')

  const { payload } = await jwtVerify(idToken, oidc.jwks, {
    issuer: oidc.issuer,
    audience: OIDC_CLIENT_ID,
    requiredClaims: ['sub', 'email', 'nonce'],
  })

  if (payload.nonce !== flow.nonce) throw new Error('ID token nonce does not match')
  if (payload.email_verified !== true || typeof payload.email !== 'string') {
    throw new Error('E-mail is not verified')
  }

  return {
    email: payload.email.toLowerCase(),
    name: typeof payload.name === 'string' ? payload.name : null,
  }
}

/** Where to send the browser so it also leaves the platform session. */
export async function endSessionUrl(): Promise<string | null> {
  if (!isOidcConfigured()) return null
  try {
    const oidc = await discover()
    if (!oidc.end_session_endpoint) return null
    const url = new URL(oidc.end_session_endpoint)
    url.search = new URLSearchParams({
      client_id: OIDC_CLIENT_ID,
      post_logout_redirect_uri: POST_LOGOUT_URL,
    }).toString()
    return url.toString()
  } catch {
    return null
  }
}
