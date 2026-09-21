'use client'

import { Globe } from '@phosphor-icons/react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import {
  defaultLocale,
  languages,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from '@/lib/i18n-config'

/**
 * Přepínač jazyka portfolia - stejný vzhled i nabídka jako na jabcore.cz.
 *
 * Vlastní komponenta, ne LanguageSwitcher z hlavního webu: ten čte jazyk
 * z react-i18next (portfolio ho záměrně nenačítá, viz layout) a skládá cesty
 * hlavního webu (/en/services). Portfolio má jen jednu stránku: čeština žije
 * na holé doméně, ostatní jazyky na /<kód>.
 */
export default function PortfolioLanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale
  label: string
}) {
  const handleChange = (value: string) => {
    if (value === locale) return

    /*
     * Stejná cookie jako na hlavním webu. Middleware podle ní rozhoduje, co
     * dostane návštěvník na holé doméně - bez ní by ho z české IP geolokace
     * vrátila do češtiny hned při dalším příchodu.
     */
    document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`

    // Plné načtení: jiný jazyk znamená jiný <html lang> a jiná data ze
    // serveru, a mapa se má přizpůsobit od začátku, ne převzít stav.
    window.location.assign(value === defaultLocale ? '/' : `/${value}`)
  }

  return (
    <x-lang>
      <Select value={locale} onValueChange={handleChange}>
        <SelectTrigger aria-label={label}>
          <Globe size={18} />
          <span>{languages[locale].flag}</span>
        </SelectTrigger>
        <SelectContent align="end">
          {Object.entries(languages).map(([code, { name, flag }]) => (
            <SelectItem key={code} value={code}>
              {flag} {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </x-lang>
  )
}
