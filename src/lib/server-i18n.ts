/**
 * Server-safe translation helper.
 * Reads locale JSON files directly - no i18next dependency.
 * Use in server components, generateMetadata, sitemap, etc.
 */
import type { Locale } from './i18n-config'

import cs from '@/locales/cs.json'
import en from '@/locales/en.json'
import de from '@/locales/de.json'
import es from '@/locales/es.json'
import pl from '@/locales/pl.json'
import sk from '@/locales/sk.json'
import fr from '@/locales/fr.json'
import it from '@/locales/it.json'
import nl from '@/locales/nl.json'
import pt from '@/locales/pt.json'
import hu from '@/locales/hu.json'
import ro from '@/locales/ro.json'

const translations: Record<string, Record<string, unknown>> = {
  cs, en, de, es, pl, sk, fr, it, nl, pt, hu, ro,
}

/**
 * Get a translation value by dot-separated key.
 * Falls back to Czech, then returns the key itself.
 */
export function t(locale: Locale, key: string): string {
  const resolve = (obj: Record<string, unknown>, path: string): string | undefined => {
    const parts = path.split('.')
    let current: unknown = obj
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined
      current = (current as Record<string, unknown>)[part]
    }
    return typeof current === 'string' ? current : undefined
  }

  return resolve(translations[locale], key)
    ?? resolve(translations['cs'], key)
    ?? key
}

/**
 * Tvar podle čísla: „1 projekt", „3 projekty", „7 projektů".
 *
 * Klíč ukazuje na objekt s kategoriemi Intl.PluralRules (one, few, many,
 * other). Chybějící kategorie se nejdřív dohledá jako `other` ve stejném
 * jazyce a teprve pak v češtině - obyčejný fallback z t() by polské stránce
 * s pěti projekty podstrčil české „projektů".
 */
export function plural(locale: Locale, key: string, count: number): string {
  const category = new Intl.PluralRules(locale).select(count)
  const own = translations[locale]

  const lookup = (obj: Record<string, unknown>, path: string): string | undefined => {
    let current: unknown = obj
    for (const part of path.split('.')) {
      if (current == null || typeof current !== 'object') return undefined
      current = (current as Record<string, unknown>)[part]
    }
    return typeof current === 'string' ? current : undefined
  }

  return (
    lookup(own, `${key}.${category}`) ??
    lookup(own, `${key}.other`) ??
    t(locale, `${key}.${category}`) ??
    t(locale, `${key}.other`)
  )
}
