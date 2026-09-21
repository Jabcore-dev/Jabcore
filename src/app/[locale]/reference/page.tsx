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
    <div className="pt-16">
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-0 h-[26rem] w-[26rem] rounded-full bg-primary/15 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-20 h-[24rem] w-[24rem] rounded-full bg-accent/15 blur-[120px]"
        />

        <div className="container relative mx-auto px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {t(locale, 'references.listEyebrow')}
            </p>
            <h1
              className="text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="gradient-text">{t(locale, 'references.title')}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {t(locale, 'references.subtitle')}
            </p>

            <a
              href={portfolioUrl}
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-accent"
            >
              {t(locale, 'references.portfolioLink')}
              <ArrowUpRight
                size={15}
                weight="bold"
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          </div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {references.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              {t(locale, 'references.empty')}
            </p>
          ) : (
            <div className="space-y-6">
              <ReferenceCard
                reference={spotlight}
                href={`/${locale}/reference/${spotlight.slug}`}
                labels={labels}
                layout="wide"
                priority
              />

              {rest.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((reference) => (
                    <ReferenceCard
                      key={reference.id}
                      reference={reference}
                      href={`/${locale}/reference/${reference.slug}`}
                      labels={labels}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/30">
        <div className="container mx-auto px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2
            className="mx-auto mb-4 max-w-2xl text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t(locale, 'references.ctaTitle')}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            {t(locale, 'references.ctaText')}
          </p>
          <Link
            href={`/${locale}/contact`}
            className="group inline-flex items-center gap-2 rounded-full bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-8 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:brightness-110"
          >
            {t(locale, 'references.ctaButton')}
            <ArrowRight
              size={17}
              weight="bold"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>
    </div>
  )
}
