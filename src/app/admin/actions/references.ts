'use server'

import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db/client'
import { references, referenceLocales } from '@/db/schema'
import { requireUser } from '@/lib/auth/guard'
import { locales, defaultLocale } from '@/lib/i18n-config'

/**
 * Writing references.
 *
 * Every action re-checks the session: a server action is a POST endpoint of
 * its own, reachable without ever loading an admin page, so the middleware
 * redirect is not what protects it.
 */

const translationSchema = z.object({
  title: z.string().trim().max(200),
  summary: z.string().trim().max(2000).optional().nullable(),
  body: z.string().optional().nullable(),
  testimonial: z.string().optional().nullable(),
  testimonialAuthor: z.string().trim().max(160).optional().nullable(),
})

const referenceSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug nesmí být prázdný.')
    // The slug is part of a public URL, so it is restricted here rather than
    // cleaned up silently — a surprise rename breaks links that already exist.
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug smí obsahovat jen malá písmena, číslice a pomlčky.'),
  clientName: z.string().trim().min(1, 'Vyplň klienta.').max(160),
  year: z.number().int().min(1990).max(2100).nullable(),
  industry: z.string().trim().max(60).nullable(),
  coverImage: z.string().trim().max(255).nullable(),
  projectUrl: z.string().trim().url('Odkaz musí být platná URL.').max(255).nullable().or(z.literal('').transform(() => null)),
  tech: z.array(z.string().trim().min(1)).max(30),
  sortOrder: z.number().int().min(0).max(9999),
  published: z.boolean(),
  featured: z.boolean(),
  translations: z.record(z.string(), translationSchema),
})

export type ReferenceInput = z.input<typeof referenceSchema>

export interface ActionResult {
  ok: boolean
  error?: string
}

/**
 * Clears every cached page a reference appears on.
 *
 * Both public sites plus the two homepages; missing one of them is how a
 * change shows up in one place and not the other for up to an hour.
 */
function revalidateReference(slug?: string) {
  revalidatePath('/', 'page')
  revalidatePath('/[locale]', 'page')
  revalidatePath('/[locale]/reference', 'page')
  revalidatePath('/portfolio/[locale]', 'page')
  revalidatePath('/sitemap.xml')
  if (slug) revalidatePath('/[locale]/reference/[slug]', 'page')
}

export async function saveReference(input: ReferenceInput): Promise<ActionResult> {
  await requireUser()

  const parsed = referenceSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Neplatná data.' }
  }

  const { id, translations, ...row } = parsed.data

  // Czech is the fallback every other language falls back to, so a reference
  // without it would render blank in the eleven languages that have no
  // translation of their own.
  const czech = translations[defaultLocale]
  if (!czech?.title?.trim()) {
    return { ok: false, error: 'Český název je povinný — ostatní jazyky se na něj odkazují.' }
  }

  // A duplicate slug would make one of the two references unreachable, since
  // the public routes look references up by slug.
  const [clash] = await db
    .select({ id: references.id })
    .from(references)
    .where(eq(references.slug, row.slug))
    .limit(1)

  if (clash && clash.id !== id) {
    return { ok: false, error: `Slug „${row.slug}" už používá jiná reference.` }
  }

  const referenceId = id
    ? (await db
        .update(references)
        .set({ ...row, updatedAt: new Date() })
        .where(eq(references.id, id))
        .returning({ id: references.id }))[0]?.id
    : (await db.insert(references).values(row).returning({ id: references.id }))[0]?.id

  if (!referenceId) return { ok: false, error: 'Referenci se nepodařilo uložit.' }

  for (const locale of locales) {
    const translation = translations[locale]
    const hasTitle = Boolean(translation?.title?.trim())

    // An emptied tab removes that translation instead of storing a blank row,
    // which would otherwise win over the Czech fallback and render an empty
    // heading on the public site.
    if (!hasTitle) {
      await db
        .delete(referenceLocales)
        .where(
          and(eq(referenceLocales.referenceId, referenceId), eq(referenceLocales.locale, locale)),
        )
      continue
    }

    const values = {
      referenceId,
      locale,
      title: translation.title.trim(),
      summary: translation.summary?.trim() || null,
      body: translation.body?.trim() || null,
      testimonial: translation.testimonial?.trim() || null,
      testimonialAuthor: translation.testimonialAuthor?.trim() || null,
      updatedAt: new Date(),
    }

    await db
      .insert(referenceLocales)
      .values(values)
      .onConflictDoUpdate({
        target: [referenceLocales.referenceId, referenceLocales.locale],
        set: values,
      })
  }

  revalidateReference(row.slug)
  return { ok: true }
}

export async function deleteReference(id: number): Promise<ActionResult> {
  await requireUser()

  const [row] = await db
    .select({ slug: references.slug })
    .from(references)
    .where(eq(references.id, id))
    .limit(1)

  // reference_locales has ON DELETE CASCADE, so the translations go with it.
  await db.delete(references).where(eq(references.id, id))

  revalidateReference(row?.slug)
  return { ok: true }
}

/** The publish switch in the list — one field, no round trip through the editor. */
export async function setPublished(id: number, published: boolean): Promise<ActionResult> {
  await requireUser()

  const [row] = await db
    .update(references)
    .set({ published, updatedAt: new Date() })
    .where(eq(references.id, id))
    .returning({ slug: references.slug })

  revalidateReference(row?.slug)
  return { ok: true }
}

export async function setFeatured(id: number, featured: boolean): Promise<ActionResult> {
  await requireUser()

  const [row] = await db
    .update(references)
    .set({ featured, updatedAt: new Date() })
    .where(eq(references.id, id))
    .returning({ slug: references.slug })

  revalidateReference(row?.slug)
  return { ok: true }
}

/** Reorders the whole list in one go, after a drag or a move button. */
export async function reorderReferences(ids: number[]): Promise<ActionResult> {
  await requireUser()

  await Promise.all(
    ids.map((id, index) =>
      db.update(references).set({ sortOrder: index * 10 }).where(eq(references.id, id)),
    ),
  )

  revalidateReference()
  return { ok: true }
}
