import 'server-only'
import { eq, and, asc, desc, inArray } from 'drizzle-orm'
import { db } from '@/db/client'
import { references, referenceLocales } from '@/db/schema'
import { defaultLocale, type Locale } from './i18n-config'
import type { LocalizedReference } from './reference-types'

/**
 * Reading references for the public sites.
 *
 * Everything here returns already-translated rows: the caller asks for a locale
 * and gets usable strings, never a locale row it has to resolve itself. Both
 * jabcore.cz and portfolio.jabcore.cz read through these functions, so the
 * fallback rules cannot drift apart between the two.
 */

type LocaleRow = typeof referenceLocales.$inferSelect

/**
 * Merges a translation over the Czech one field by field.
 *
 * Per field, not per row: a translator who filled in the title but not the case
 * study should get the translated title next to the Czech body, rather than the
 * whole reference silently reverting to Czech. An empty string counts as
 * missing — that is what a cleared field in the admin leaves behind.
 */
function resolveLocale(rows: LocaleRow[], locale: Locale): LocaleRow | null {
  const fallback = rows.find((row) => row.locale === defaultLocale)
  const wanted = rows.find((row) => row.locale === locale)

  if (!wanted) return fallback ?? null
  if (!fallback || wanted.locale === fallback.locale) return wanted

  const pick = <K extends keyof LocaleRow>(key: K): LocaleRow[K] => {
    const value = wanted[key]
    return value === null || value === '' ? fallback[key] : value
  }

  return {
    ...wanted,
    title: pick('title'),
    summary: pick('summary'),
    body: pick('body'),
    testimonial: pick('testimonial'),
    testimonialAuthor: pick('testimonialAuthor'),
  }
}

function toLocalized(
  reference: typeof references.$inferSelect,
  rows: LocaleRow[],
  locale: Locale,
): LocalizedReference | null {
  const text = resolveLocale(rows, locale)

  // No Czech row and no translation means there is nothing to show. Skipping it
  // is better than rendering a card with an empty heading.
  if (!text) return null

  return {
    id: reference.id,
    slug: reference.slug,
    clientName: reference.clientName,
    year: reference.year,
    industry: reference.industry,
    coverImage: reference.coverImage,
    projectUrl: reference.projectUrl,
    tech: reference.tech,
    featured: reference.featured,
    title: text.title,
    summary: text.summary,
    body: text.body,
    testimonial: text.testimonial,
    testimonialAuthor: text.testimonialAuthor,
    availableLocales: rows.map((row) => row.locale),
  }
}

/** Published references, featured first, then by the admin's manual order. */
export async function getPublishedReferences(locale: Locale): Promise<LocalizedReference[]> {
  const rows = await db
    .select()
    .from(references)
    .where(eq(references.published, true))
    .orderBy(desc(references.featured), asc(references.sortOrder), desc(references.year))

  if (rows.length === 0) return []

  // One query for every translation rather than one per reference — the listing
  // is the hottest page on the portfolio site.
  const localeRows = await db
    .select()
    .from(referenceLocales)
    .where(
      inArray(
        referenceLocales.referenceId,
        rows.map((row) => row.id),
      ),
    )

  const byReference = new Map<number, LocaleRow[]>()
  for (const row of localeRows) {
    const list = byReference.get(row.referenceId) ?? []
    list.push(row)
    byReference.set(row.referenceId, list)
  }

  return rows
    .map((row) => toLocalized(row, byReference.get(row.id) ?? [], locale))
    .filter((row): row is LocalizedReference => row !== null)
}

/** One published reference, or null — an unpublished slug must 404, not render. */
export async function getReferenceBySlug(
  slug: string,
  locale: Locale,
): Promise<LocalizedReference | null> {
  const [row] = await db
    .select()
    .from(references)
    .where(and(eq(references.slug, slug), eq(references.published, true)))
    .limit(1)

  if (!row) return null

  const localeRows = await db
    .select()
    .from(referenceLocales)
    .where(eq(referenceLocales.referenceId, row.id))

  return toLocalized(row, localeRows, locale)
}

/** Slugs for generateStaticParams and the sitemap. */
export async function getPublishedSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: references.slug })
    .from(references)
    .where(eq(references.published, true))

  return rows.map((row) => row.slug)
}

/** Industry keys actually in use, for the portfolio filter. */
export async function getUsedIndustries(): Promise<string[]> {
  const rows = await db
    .select({ industry: references.industry })
    .from(references)
    .where(eq(references.published, true))

  const unique = new Set(
    rows.map((row) => row.industry).filter((value): value is string => Boolean(value)),
  )
  return [...unique].sort()
}

export type { LocalizedReference }
