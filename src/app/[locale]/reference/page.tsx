import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/ssr'
import { generatePageMetadata } from '@/lib/metadata'
import { locales, defaultLocale, type Locale } from '@/lib/i18n-config'
import { t } from '@/lib/server-i18n'
import { PORTFOLIO_URL } from '@/lib/site-config'
import { getPublishedReferences } from '@/lib/references'
import { skipPrerenderWithoutDatabase } from '@/lib/db-runtime'
import ReferenceCard from '@/components/references/ReferenceCard'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

/**
 * Přestavuje se nejvýš jednou za hodinu, a hned když admin uloží - admin volá
 * revalidatePath na tuhle routu. Bez intervalu by reference publikovaná na
 * nedotčeném serveru čekala na příští nasazení.
 */
export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale = (locales as readonly string[]).includes(rawLocale)
    ? (rawLocale as Locale)
    : defaultLocale

  return generatePageMetadata({ page: 'references', path: '/reference', locale })
}

export default async function ReferencesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = (locales as readonly string[]).includes(rawLocale)
    ? (rawLocale as Locale)
    : defaultLocale

  await skipPrerenderWithoutDatabase()
  const references = await getPublishedReferences(locale)

  const labels = {
    year: t(locale, 'references.year'),
    detail: t(locale, 'references.viewDetail'),
    featured: t(locale, 'references.featuredLabel'),
  }

  /*
   * Seznam přichází seřazený „zvýrazněné první", takže první položka je ta,
   * kterou chce admin ukázat. Dostane vlastní širokou kartu nad mřížkou -
   * jinak by se v řadě tří stejných karet ztratila.
   */
  const [spotlight, ...rest] = references

  const portfolioUrl = locale === defaultLocale ? PORTFOLIO_URL : `${PORTFOLIO_URL}/${locale}`

  return (
    <x-page>
      <section data-block="page-hero">
        <x-glow aria-hidden="true" data-side="left" />
        <x-glow aria-hidden="true" data-side="right" />

        <x-wrap>
          <x-eyebrow>{t(locale, 'references.listEyebrow')}</x-eyebrow>
          <h1>
            <x-gradient>{t(locale, 'references.title')}</x-gradient>
          </h1>
          <p>{t(locale, 'references.subtitle')}</p>

          {/* Portfolio je samostatný web - v novém okně, ať návštěvník nepřijde
              o stránku, ze které přišel. noopener: nová karta nedostane přístup
              k window.opener téhle stránky. */}
          <a href={portfolioUrl} target="_blank" rel="noopener" data-button="link">
            {t(locale, 'references.portfolioLink')}
            <ArrowUpRight size={15} weight="bold" />
          </a>
        </x-wrap>
      </section>

      <section data-block="reference-list">
        <x-wrap>
          {references.length === 0 ? (
            <x-empty>{t(locale, 'references.empty')}</x-empty>
          ) : (
            <>
              <ReferenceCard
                reference={spotlight}
                href={`/${locale}/reference/${spotlight.slug}`}
                labels={labels}
                layout="wide"
                priority
              />

              {rest.length > 0 && (
                <x-reference-grid>
                  {rest.map((reference) => (
                    <ReferenceCard
                      key={reference.id}
                      reference={reference}
                      href={`/${locale}/reference/${reference.slug}`}
                      labels={labels}
                    />
                  ))}
                </x-reference-grid>
              )}
            </>
          )}
        </x-wrap>
      </section>

      <section data-block="closing-cta">
        <x-wrap>
          <h2>{t(locale, 'references.ctaTitle')}</h2>
          <p>{t(locale, 'references.ctaText')}</p>
          <Link href={`/${locale}/contact`} data-button="solid">
            {t(locale, 'references.ctaButton')}
            <ArrowRight size={17} weight="bold" />
          </Link>
        </x-wrap>
      </section>
    </x-page>
  )
}
