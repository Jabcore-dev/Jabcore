import { NextResponse, type NextRequest } from 'next/server'
import { eq, and, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { pageViews, references } from '@/db/schema'
import { locales } from '@/lib/i18n-config'
import { clientIp, countryOfIp } from '@/lib/geo'

export const dynamic = 'force-dynamic'

/**
 * Counts one page view.
 *
 * Called by a beacon from the browser, not from the page render: pages are
 * served from the ISR cache and would only ever count the render that filled
 * it. Nothing identifying is stored - no cookie, no address, no id - just a
 * per-day counter, so this needs no consent.
 *
 * Whatever arrives here is untrusted: the endpoint is public and anyone can
 * POST to it. It can therefore inflate a counter, which is why the numbers are
 * a guide to what interests people and not something to invoice on.
 */

/** "/cs/reference/foo" → "/reference/foo", "/en" → "/" */
function normalizePath(raw: string): { path: string; locale: string } | null {
  if (!raw.startsWith('/') || raw.length > 255) return null

  // Query and hash are not part of what we count.
  const clean = raw.split('?')[0].split('#')[0]
  const parts = clean.split('/').filter(Boolean)

  let locale = 'cs'
  if (parts.length > 0 && (locales as readonly string[]).includes(parts[0])) {
    locale = parts.shift()!
  }

  return { path: `/${parts.join('/')}`, locale }
}

/** Referrer host only - never the full URL, which can carry search terms. */
function sourceOf(referrer: string | null, host: string | null): string {
  if (!referrer) return 'direct'

  try {
    const url = new URL(referrer)
    // Navigation inside our own site is not a source.
    if (host && url.host === host) return 'internal'
    return url.host.replace(/^www\./, '').slice(0, 120)
  } catch {
    return 'direct'
  }
}

export async function POST(request: NextRequest) {
  let body: { path?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const normalized = typeof body.path === 'string' ? normalizePath(body.path) : null
  if (!normalized) return NextResponse.json({ ok: false }, { status: 400 })

  const { path, locale } = normalized
  const source = sourceOf(request.headers.get('referer'), request.headers.get('host'))

  // Internal navigation is still a view of the page, just not a new arrival.
  if (source === 'internal' && path === '/') return NextResponse.json({ ok: true })

  const country = countryOfIp(clientIp(request.headers)) ?? 'other'
  const day = new Date().toISOString().slice(0, 10)

  // Link the row to the reference so the admin can rank them without parsing
  // paths later.
  let referenceId: number | null = null
  const slug = path.startsWith('/reference/') ? path.slice('/reference/'.length) : null

  if (slug) {
    const [row] = await db
      .select({ id: references.id })
      .from(references)
      .where(eq(references.slug, slug))
      .limit(1)
    referenceId = row?.id ?? null
  }

  try {
    await db
      .insert(pageViews)
      .values({ path, referenceId, locale, day, source, country })
      .onConflictDoUpdate({
        target: [pageViews.path, pageViews.locale, pageViews.day, pageViews.source, pageViews.country],
        set: { count: sql`${pageViews.count} + 1` },
      })
  } catch (error) {
    // A counter is never worth failing a request over.
    console.error('počítadlo zobrazení selhalo', error)
  }

  return NextResponse.json({ ok: true })
}
