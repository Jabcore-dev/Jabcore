import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en.json'
import cs from '@/locales/cs.json'
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

export const SUPPORTED_LANGUAGES = Object.keys(languages) as Array<keyof typeof languages>

export const STORAGE_KEY = 'jabcore_locale'

const resources = {
  en: { translation: en },
  cs: { translation: cs },
  de: { translation: de },
  es: { translation: es },
  pl: { translation: pl },
  sk: { translation: sk },
  fr: { translation: fr },
  it: { translation: it },
  nl: { translation: nl },
  pt: { translation: pt },
  hu: { translation: hu },
  ro: { translation: ro },
}

// LanguageDetector (i18next-browser-languagedetector) je browser-only — na serveru
// nemá přístup k localStorage ani navigator, proto padá na fallbackLng: 'en'.
// Klient detekuje jazyk synchronně při init a dostane jiný výsledek → hydration mismatch.
//
// Řešení: inicializovat vždy s pevným lng: 'cs' (konzistentní s lang="cs" v HTML
// a OpenGraph locale cs_CZ). Detekci uložené preference přebírá I18nProvider.useEffect
// který běží výhradně na klientovi, tedy až PO úspěšné hydrataci.
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'cs',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    })
}

export default i18n
