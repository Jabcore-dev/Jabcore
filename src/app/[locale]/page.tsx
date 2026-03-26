import { generatePageMetadata } from '@/lib/metadata'
import { buildOrganizationJsonLd } from '@/lib/jsonld'
import { locales, defaultLocale, type Locale } from '@/lib/i18n-config'
import HomePage from '@/views/HomePage'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale = (locales as readonly string[]).includes(rawLocale)
    ? (rawLocale as Locale)
    : defaultLocale

  return generatePageMetadata({
    page: 'home',
    path: '',
    locale,
    isHome: true,
  })
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationJsonLd()) }}
      />
      <HomePage />
    </>
  )
}
