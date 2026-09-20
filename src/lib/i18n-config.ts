export const defaultLocale = 'cs' as const

export const locales = ['cs', 'en', 'de', 'es', 'pl', 'sk', 'fr', 'it', 'nl', 'pt', 'hu', 'ro'] as const

export type Locale = (typeof locales)[number]

/**
 * Názvy a vlajky jazyků.
 *
 * Tady, a ne v lib/i18n.ts: ten importuje react-i18next, takže jakmile na něj
 * sáhne server komponenta nebo middleware, skončí celá knihovna v jejich
 * bundlu a build spadne na „createContext is not a function".
 */
export const languages = {
  en: { name: 'English', flag: '🇬🇧' },
  cs: { name: 'Čeština', flag: '🇨🇿' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Español', flag: '🇪🇸' },
  pl: { name: 'Polski', flag: '🇵🇱' },
  sk: { name: 'Slovenčina', flag: '🇸🇰' },
  fr: { name: 'Français', flag: '🇫🇷' },
  it: { name: 'Italiano', flag: '🇮🇹' },
  nl: { name: 'Nederlands', flag: '🇳🇱' },
  pt: { name: 'Português', flag: '🇵🇹' },
  hu: { name: 'Magyar', flag: '🇭🇺' },
  ro: { name: 'Română', flag: '🇷🇴' },
}

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

/**
 * Ručně vybraný jazyk, uložený do cookie.
 *
 * Middleware rozhoduje o jazyce ještě před renderem a do localStorage nevidí,
 * takže volba z přepínače musí být v cookie - jinak by ji geolokace při další
 * navigaci přebila.
 *
 * Konstanty jsou tady, a ne v lib/i18n.ts: ten importuje react-i18next a
 * jakmile na něj sáhne middleware, skončí celá knihovna v edge bundlu.
 */
export const LOCALE_COOKIE = 'jabcore_locale'

/** Rok - volba jazyka není nic, co by se mělo zapomínat za týden. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
