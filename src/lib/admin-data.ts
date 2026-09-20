import 'server-only'
import { desc, asc, eq, sql, inArray, gte, and, isNotNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { references, referenceLocales, adminUsers, contactMessages, pageViews } from '@/db/schema'
import { locales } from './i18n-config'

/**
 * Queries for the admin panel.
 *
 * Kept apart from lib/references.ts because the rules are the opposite ones:
 * the public site sees only published rows and one resolved language, the
 * panel sees everything, untranslated and unpublished included.
 */

export interface AdminReference {
  id: number
  slug: string
  clientName: string
  year: number | null
  industry: string | null
  coverImage: string | null
  projectUrl: string | null
  tech: string[]
  sortOrder: number
  published: boolean
  featured: boolean
  /** Every translation, keyed by locale - the editor edits all of them at once. */
  noindex: boolean
  translations: Record<string, {
    title: string
    summary: string | null
    body: string | null
    testimonial: string | null
    testimonialAuthor: string | null
    metaTitle: string | null
    metaDescription: string | null
  }>
  /** Locales with a title filled in, so the editor can show what is missing. */
  filledLocales: string[]
}

export async function listReferences(): Promise<AdminReference[]> {
  const rows = await db
    .select()
    .from(references)
    .orderBy(desc(references.featured), asc(references.sortOrder), desc(references.id))

  if (rows.length === 0) return []

  const localeRows = await db
    .select()
    .from(referenceLocales)
    .where(inArray(referenceLocales.referenceId, rows.map((row) => row.id)))

  return rows.map((row) => {
    const translations: AdminReference['translations'] = {}
    const filled: string[] = []

    for (const localeRow of localeRows) {
      if (localeRow.referenceId !== row.id) continue

      translations[localeRow.locale] = {
        title: localeRow.title,
        summary: localeRow.summary,
        body: localeRow.body,
        testimonial: localeRow.testimonial,
        testimonialAuthor: localeRow.testimonialAuthor,
        metaTitle: localeRow.metaTitle,
        metaDescription: localeRow.metaDescription,
      }

      if (localeRow.title.trim()) filled.push(localeRow.locale)
    }

    return {
      id: row.id,
      slug: row.slug,
      clientName: row.clientName,
      year: row.year,
      industry: row.industry,
      coverImage: row.coverImage,
      projectUrl: row.projectUrl,
      tech: row.tech,
      sortOrder: row.sortOrder,
      published: row.published,
      featured: row.featured,
      noindex: row.noindex,
      translations,
      // Sorted the way the language tabs are, so "missing" badges line up.
      filledLocales: locales.filter((locale) => filled.includes(locale)),
    }
  })
}

export async function listUsers() {
  return db.select().from(adminUsers).orderBy(asc(adminUsers.email))
}

export async function listMessages(status?: string) {
  const query = db.select().from(contactMessages)

  const rows = status
    ? await query.where(eq(contactMessages.status, status)).orderBy(desc(contactMessages.createdAt))
    : await query.orderBy(desc(contactMessages.createdAt))

  return rows
}

/** Numbers for the dashboard. */
export async function getStats() {
  const [references_, published, messages, unread, users] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(references),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(references)
      .where(eq(references.published, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(contactMessages),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(contactMessages)
      .where(eq(contactMessages.status, 'new')),
    db.select({ count: sql<number>`count(*)::int` }).from(adminUsers),
  ])

  return {
    references: references_[0]?.count ?? 0,
    published: published[0]?.count ?? 0,
    messages: messages[0]?.count ?? 0,
    unread: unread[0]?.count ?? 0,
    users: users[0]?.count ?? 0,
  }
}

/* ---------------------------------------------------------------- statistiky */

/** Datum před N dny ve tvaru YYYY-MM-DD, jak je uložený sloupec `day`. */
function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

export interface ViewStats {
  total: number
  previousTotal: number
  byDay: { day: string; count: number }[]
  topReferences: { id: number; slug: string; title: string; count: number }[]
  topPages: { path: string; count: number }[]
  sources: { source: string; count: number }[]
  countries: { country: string; count: number }[]
  locales: { locale: string; count: number }[]
}

/**
 * Čísla pro stránku statistik.
 *
 * Počítá se z `page_views`, která vzniká z beaconu v prohlížeči - crawlery
 * skript nespustí, takže jsou to lidé, ne roboti. Zároveň je endpoint veřejný,
 * takže se čísla dají nafouknout; je to vodítko, ne účetnictví.
 */
export async function getViewStats(days = 30): Promise<ViewStats> {
  const from = daysAgo(days)
  // Stejně dlouhé předchozí období, aby šlo říct „víc/míň než minule".
  const previousFrom = daysAgo(days * 2)

  const sum = sql<number>`coalesce(sum(${pageViews.count}), 0)::int`

  const [
    totalRow,
    previousRow,
    byDay,
    topReferences,
    topPages,
    sources,
    countries,
    localeRows,
  ] = await Promise.all([
    db.select({ value: sum }).from(pageViews).where(gte(pageViews.day, from)),

    db
      .select({ value: sum })
      .from(pageViews)
      .where(and(gte(pageViews.day, previousFrom), sql`${pageViews.day} < ${from}`)),

    db
      .select({ day: pageViews.day, count: sum })
      .from(pageViews)
      .where(gte(pageViews.day, from))
      .groupBy(pageViews.day)
      .orderBy(asc(pageViews.day)),

    db
      .select({
        id: references.id,
        slug: references.slug,
        title: referenceLocales.title,
        count: sum,
      })
      .from(pageViews)
      .innerJoin(references, eq(pageViews.referenceId, references.id))
      // Český název: v seznamu chceme jedno jméno, ne dvanáct variant.
      .leftJoin(
        referenceLocales,
        and(eq(referenceLocales.referenceId, references.id), eq(referenceLocales.locale, 'cs')),
      )
      .where(and(gte(pageViews.day, from), isNotNull(pageViews.referenceId)))
      .groupBy(references.id, references.slug, referenceLocales.title)
      .orderBy(desc(sum))
      .limit(10),

    db
      .select({ path: pageViews.path, count: sum })
      .from(pageViews)
      .where(gte(pageViews.day, from))
      .groupBy(pageViews.path)
      .orderBy(desc(sum))
      .limit(10),

    db
      .select({ source: pageViews.source, count: sum })
      .from(pageViews)
      .where(gte(pageViews.day, from))
      .groupBy(pageViews.source)
      .orderBy(desc(sum))
      .limit(8),

    db
      .select({ country: pageViews.country, count: sum })
      .from(pageViews)
      .where(gte(pageViews.day, from))
      .groupBy(pageViews.country)
      .orderBy(desc(sum)),

    db
      .select({ locale: pageViews.locale, count: sum })
      .from(pageViews)
      .where(gte(pageViews.day, from))
      .groupBy(pageViews.locale)
      .orderBy(desc(sum)),
  ])

  return {
    total: totalRow[0]?.value ?? 0,
    previousTotal: previousRow[0]?.value ?? 0,
    byDay: byDay.map((row) => ({ day: String(row.day), count: row.count })),
    topReferences: topReferences.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title ?? row.slug,
      count: row.count,
    })),
    topPages,
    sources,
    countries,
    locales: localeRows,
  }
}
