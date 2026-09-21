import 'server-only'
import type { Locale } from './i18n-config'
import { generateJson } from './gemini'

/**
 * Překlad textů jedné reference z češtiny do jiného jazyka.
 *
 * Posílají se jen vyplněná pole - prázdné pole se nepřekládá a zůstane
 * prázdné i v cílovém jazyce, takže web pro něj použije češtinu stejně jako
 * dosud.
 */

export const TRANSLATABLE_FIELDS = [
  'title',
  'summary',
  'body',
  'testimonial',
  'testimonialAuthor',
  'metaTitle',
  'metaDescription',
] as const

export type TranslatableField = (typeof TRANSLATABLE_FIELDS)[number]
export type TranslationFields = Partial<Record<TranslatableField, string>>

/** Stejné stropy jako ve schématu ukládání - delší text by uložení odmítlo. */
const MAX_LENGTH: Record<TranslatableField, number> = {
  title: 200,
  summary: 2000,
  body: 50_000,
  testimonial: 2000,
  testimonialAuthor: 160,
  metaTitle: 200,
  metaDescription: 320,
}

/** Anglické názvy jazyků - zadání pro model je anglicky, takže i jazyk. */
const LANGUAGE_NAMES: Record<Locale, string> = {
  cs: 'Czech',
  en: 'English',
  de: 'German',
  es: 'Spanish (Spain)',
  pl: 'Polish',
  sk: 'Slovak',
  fr: 'French',
  it: 'Italian',
  nl: 'Dutch',
  pt: 'Portuguese (Portugal)',
  hu: 'Hungarian',
  ro: 'Romanian',
}

function systemPrompt(locale: Locale): string {
  const language = LANGUAGE_NAMES[locale]

  return `You are a professional translator working for Jabcore, a Czech software development studio. You translate the texts of one portfolio case study from Czech into ${language}.

Rules:
- Write natural, fluent ${language} for business readers (potential clients). Translate the meaning, not word for word. Keep the tone: factual, concrete, confident. Do not add or remove information.
- Keep Markdown exactly as it is: headings, lists, bold and italic text, links, line breaks and blank lines. Translate link text, never URLs.
- Never translate company names, client names, personal names, product names or technology names (e.g. Next.js, PostgreSQL, React Native).
- Keep numbers and units, but use the number formatting of ${language}.
- "testimonialAuthor" is "Name, job title": keep the name, translate only the job title.
- "metaTitle" is a search-result title: at most 60 characters. "metaDescription" is a search-result description: at most 155 characters.
- Return a JSON object with exactly the keys you received and nothing else.`
}

function clamp(value: string, max: number): string {
  if (value.length <= max) return value
  const cut = value.slice(0, max)
  // Na hranici slova, ne uprostřed - hlavně u meta textů, které vidí Google.
  const space = cut.lastIndexOf(' ')
  return (space > max * 0.6 ? cut.slice(0, space) : cut).trim()
}

export async function translateReferenceFields(
  source: TranslationFields,
  locale: Locale,
): Promise<TranslationFields> {
  const filled = TRANSLATABLE_FIELDS.filter((field) => source[field]?.trim())
  if (filled.length === 0) return {}

  const input = Object.fromEntries(filled.map((field) => [field, source[field]!.trim()]))

  const result = await generateJson({
    system: systemPrompt(locale),
    input: JSON.stringify(input),
    requiredKeys: filled,
  })

  return Object.fromEntries(
    filled.map((field) => [field, clamp(result[field], MAX_LENGTH[field])]),
  ) as TranslationFields
}
