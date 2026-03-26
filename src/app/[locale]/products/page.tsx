import { generatePageMetadata } from '@/lib/metadata'
import { locales, defaultLocale, type Locale } from '@/lib/i18n-config'
import ProductsPage from '@/views/ProductsPage'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale = (locales as readonly string[]).includes(rawLocale)
    ? (rawLocale as Locale)
    : defaultLocale

  return generatePageMetadata({ page: 'products', path: '/products', locale })
}

export default ProductsPage
