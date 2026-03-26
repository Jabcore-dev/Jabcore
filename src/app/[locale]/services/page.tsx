import { generatePageMetadata } from '@/lib/metadata'
import { locales, defaultLocale, type Locale } from '@/lib/i18n-config'
import ServicesPage from '@/views/ServicesPage'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale = (locales as readonly string[]).includes(rawLocale)
    ? (rawLocale as Locale)
    : defaultLocale

  return generatePageMetadata({ page: 'services', path: '/services', locale })
}

export default ServicesPage
