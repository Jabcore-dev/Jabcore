/**
 * Server-safe translation helper.
 * Reads locale JSON files directly — no i18next dependency.
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
