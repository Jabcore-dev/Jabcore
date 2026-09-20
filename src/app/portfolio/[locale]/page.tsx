import type { Metadata } from 'next'
import { marked } from 'marked'
import { locales, defaultLocale, ogLocales, type Locale } from '@/lib/i18n-config'
import { t } from '@/lib/server-i18n'
import { SITE_URL, PORTFOLIO_URL } from '@/lib/site-config'
import { getPublishedReferences, getUsedIndustries } from '@/lib/references'
import { skipPrerenderWithoutDatabase } from '@/lib/db-runtime'
import { buildReferenceJsonLd } from '@/lib/jsonld'
import PortfolioGrid from '@/components/references/PortfolioGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * The portfolio one-pager, served at portfolio.jabcore.cz.
 *
 * The URL a visitor sees is portfolio.jabcore.cz/ (Czech) or /<locale>;
 * middleware rewrites both onto this route. Nothing links here from the main
 * domain's path space - jabcore.cz/<locale>/portfolio is redirected away, so
 * the same content never lives at two addresses.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const revalidate = 3600

function resolveLocale(raw: string): Locale {
  return (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale
}

/** Czech lives at the bare domain, every other language behind its prefix. */
function portfolioUrl(locale: Locale): string {
  return locale === defaultLocale ? PORTFOLIO_URL : `${PORTFOLIO_URL}/${locale}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = resolveLocale(rawLocale)

  const title = t(locale, 'portfolio.seoTitle')
  const description = t(locale, 'portfolio.seoDescription')

  const languages: Record<string, string> = {}
  for (const loc of locales) languages[loc] = portfolioUrl(loc)
  languages['x-default'] = PORTFOLIO_URL

  return {
    title: { absolute: title },
    description,
    // Canonical points at the portfolio domain, never at jabcore.cz - this is
    // the only address this content is meant to be indexed under.
    alternates: { canonical: portfolioUrl(locale), languages },
    openGraph: {
      title,
      description,
      url: portfolioUrl(locale),
      siteName: 'Jabcore',
      locale: ogLocales[locale] ?? 'cs_CZ',
      type: 'website',
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Jabcore' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/og-image.png`],
    },
  }
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = resolveLocale(rawLocale)

  await skipPrerenderWithoutDatabase()

  const [references, industryKeys] = await Promise.all([
    getPublishedReferences(locale),
    getUsedIndustries(),
  ])

  const industries = industryKeys.map((key) => ({
    key,
    // Falls back to the raw key when an industry has no label yet, so a new
    // one shows up as "logistika" rather than as a missing translation.
    label: t(locale, `references.industries.${key}`) || key,
  }))

  return (
    <main>
      {/* One CreativeWork per reference. The whole portfolio is a single URL,
          so without these a crawler sees one long page instead of a list of
          projects. */}
      {references.map((reference) => (
        <script
          key={reference.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              buildReferenceJsonLd(reference, `${portfolioUrl(locale)}#${reference.slug}`),
            ),
          }}
        />
      ))}

      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Jabcore
          </span>
          <a
            href={locale === defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t(locale, 'portfolio.backToSite')} →
          </a>
        </div>
      </header>

      <section className="pt-10 pb-20 sm:pt-14 sm:pb-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1
              className="mb-6 text-5xl font-bold sm:text-6xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t(locale, 'portfolio.title')}
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              {t(locale, 'portfolio.subtitle')}
            </p>
          </div>

          <PortfolioGrid
            references={references}
            industries={industries}
            labels={{
              all: t(locale, 'references.allIndustries'),
              year: t(locale, 'references.year'),
              empty: t(locale, 'references.empty'),
            }}
          />
        </div>
      </section>

      {/* Full case studies, one anchor each - this is what the cards link to
          and what makes the one-pager worth indexing. */}
      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-24">
            {references.map(async (reference) => {
              const bodyHtml = reference.body ? await marked.parse(reference.body) : null

              return (
                <article key={reference.id} id={reference.slug} className="scroll-mt-24">
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{reference.clientName}</span>
                    {reference.year && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{reference.year}</span>
                      </>
                    )}
                  </div>

                  <h2
                    className="mb-6 text-3xl font-bold sm:text-4xl"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {reference.title}
                  </h2>

                  {reference.summary && (
                    <p className="mb-6 text-lg text-muted-foreground">{reference.summary}</p>
                  )}

                  {reference.tech.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-2">
                      {reference.tech.map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {bodyHtml && (
                    <div
                      className="prose prose-lg max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  )}

                  {reference.testimonial && (
                    <blockquote className="mt-8 border-l-4 border-primary py-2 pl-6">
                      <p className="mb-3 italic">{reference.testimonial}</p>
                      {reference.testimonialAuthor && (
                        <footer className="text-sm text-muted-foreground">
                          - {reference.testimonialAuthor}
                        </footer>
                      )}
                    </blockquote>
                  )}

                  {reference.projectUrl && (
                    <div className="mt-8">
                      <Button asChild variant="outline">
                        <a href={reference.projectUrl} target="_blank" rel="noopener noreferrer">
                          {t(locale, 'references.viewProject')} ↗
                        </a>
                      </Button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            {t(locale, 'portfolio.cta')}
          </h2>
          <Button asChild size="lg">
            <a href={`${SITE_URL}/${locale}/contact`}>{t(locale, 'portfolio.ctaButton')}</a>
          </Button>
        </div>
      </footer>
    </main>
  )
}
