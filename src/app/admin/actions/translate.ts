'use server'

import { z } from 'zod'
import { requireUser } from '@/lib/auth/guard'
import { locales, defaultLocale, type Locale } from '@/lib/i18n-config'
import { GeminiError } from '@/lib/gemini'
import { translateReferenceFields, type TranslationFields } from '@/lib/reference-translation'

/**
 * Překlad reference z češtiny do jednoho jazyka.
 *
 * Jeden jazyk na volání, ne všech jedenáct najednou: admin volá jazyky
 * souběžně a u každé záložky hned vidí, že je hotová. Jeden velký požadavek by
 * minutu nic neukazoval, a kdyby selhal, přišlo by se o všechny jazyky naráz.
 *
 * Výsledek se neukládá - vrací se do formuláře, admin si ho může projít
 * a opravit, a do databáze jde až tlačítkem Uložit.
 */

const inputSchema = z.object({
  locale: z
    .string()
    .refine(
      (value): value is Locale =>
        (locales as readonly string[]).includes(value) && value !== defaultLocale,
      'Neplatný cílový jazyk.',
    ),
  source: z.object({
    title: z.string().max(200).optional(),
    summary: z.string().max(2000).optional(),
    body: z.string().max(50_000).optional(),
    testimonial: z.string().max(2000).optional(),
    testimonialAuthor: z.string().max(160).optional(),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(320).optional(),
  }),
})

export type TranslateResult =
  | { ok: true; translation: TranslationFields }
  | { ok: false; error: string }

export async function translateReference(input: {
  locale: string
  source: TranslationFields
}): Promise<TranslateResult> {
  await requireUser()

  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Neplatná data.' }
  }

  if (!parsed.data.source.title?.trim()) {
    return { ok: false, error: 'Nejdřív vyplň český název.' }
  }

  try {
    const translation = await translateReferenceFields(
      parsed.data.source,
      parsed.data.locale as Locale,
    )
    return { ok: true, translation }
  } catch (error) {
    if (error instanceof GeminiError) return { ok: false, error: error.message }
    console.error('translateReference selhal', error)
    return { ok: false, error: 'Překlad selhal.' }
  }
}
