import 'server-only'
import { desc, asc, eq, sql, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { references, referenceLocales, adminUsers, contactMessages } from '@/db/schema'
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
  /** Every translation, keyed by locale — the editor edits all of them at once. */
  translations: Record<string, {
    title: string
    summary: string | null
    body: string | null
    testimonial: string | null
    testimonialAuthor: string | null
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
