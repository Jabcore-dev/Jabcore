'use client'

import { Globe } from '@phosphor-icons/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { usePathname, useRouter } from 'next/navigation'
import { languages, STORAGE_KEY } from '@/lib/i18n'
import { locales } from '@/lib/i18n-config'

/** Strip /{locale} prefix from pathname */
function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split('/')
  if (parts.length >= 2 && (locales as readonly string[]).includes(parts[1])) {
    return '/' + parts.slice(2).join('/')
  }
  return pathname
}

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value)
    localStorage.setItem(STORAGE_KEY, value)

    // Navigate to the same page in the new locale
    const pathWithoutLocale = stripLocalePrefix(pathname)
    const normalized = pathWithoutLocale === '/' ? '' : pathWithoutLocale
    router.push(`/${value}${normalized}`)
  }

  const langCode = i18n.language?.split('-')[0] || 'en'
  const currentLanguage = languages[langCode as keyof typeof languages] || languages.en

  return (
    <Select value={langCode} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-auto h-10 px-3 gap-2 border-0 bg-transparent hover:bg-accent/50 rounded-full">
        <Globe className="h-5 w-5" />
        <span className="hidden sm:inline">{currentLanguage.flag}</span>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(languages).map(([code, { name, flag }]) => (
          <SelectItem key={code} value={code}>
            <span className="flex items-center gap-2">
              <span>{flag}</span>
              <span>{name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}