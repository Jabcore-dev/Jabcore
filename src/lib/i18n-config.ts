export const defaultLocale = 'cs' as const

export const locales = ['cs', 'en', 'de', 'es', 'pl', 'sk', 'fr', 'it', 'nl', 'pt', 'hu', 'ro'] as const

export type Locale = (typeof locales)[number]

/** OG locale codes per language */
export const ogLocales: Record<string, string> = {
  cs: 'cs_CZ',
  en: 'en_US',
  de: 'de_DE',
  es: 'es_ES',
  pl: 'pl_PL',
  sk: 'sk_SK',
  fr: 'fr_FR',
  it: 'it_IT',
  nl: 'nl_NL',
  pt: 'pt_PT',
  hu: 'hu_HU',
  ro: 'ro_RO',
}
