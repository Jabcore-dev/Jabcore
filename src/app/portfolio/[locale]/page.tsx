import type { Metadata } from 'next'
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/ssr'
import { locales, defaultLocale, ogLocales, type Locale } from '@/lib/i18n-config'
import { t } from '@/lib/server-i18n'
import { SITE_URL, PORTFOLIO_URL } from '@/lib/site-config'
import { getPublishedReferences, getUsedIndustries } from '@/lib/references'
import { skipPrerenderWithoutDatabase } from '@/lib/db-runtime'
import { buildReferenceJsonLd } from '@/lib/jsonld'
import type { MapProject } from '@/lib/portfolio-map'
import PortfolioMap from '@/components/portfolio/PortfolioMap'
import CaseStudy from '@/components/portfolio/CaseStudy'

/**
 * Portfolio one-pager na portfolio.jabcore.cz.
 *
 * Adresa, kterou návštěvník vidí, je portfolio.jabcore.cz/ (česky) nebo
 * /<locale>; middleware obojí přepisuje na tuhle routu. Z hlavní domény sem
 * nic neodkazuje - jabcore.cz/<locale>/portfolio je přesměrované pryč, aby
 * stejný obsah nežil na dvou adresách.
 *
 * Stránka má dvě vrstvy toho samého obsahu, a to schválně:
 *
 *   1. Mapa bublin přes celé okno. To je nástroj pro schůzku - obchodník
 *      odjede na celek, najede na projekt, otevře panel. Interaktivní, takže
 *      klientská komponenta.
 *   2. Case studies pod ní. Čtený text, a zároveň to, co dostane vyhledávač
 *      a návštěvník bez JavaScriptu. Serverové komponenty, celé v HTML.
 *
 * Tělo case study se do mapy netahá - panel ukazuje shrnutí a tlačítkem
 * odroluje na plný text, takže stejný odstavec není ve stránce dvakrát.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const revalidate = 3600

function resolveLocale(raw: string): Locale {
  return (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale
}

/** Čeština žije na holé doméně, každý další jazyk za svým prefixem. */
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
    // Canonical míří na portfolio doménu, nikdy na jabcore.cz - tohle je
    // jediná adresa, pod kterou se má obsah indexovat.
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
    // Když obor ještě nemá překlad, radši ukázat holý klíč než chybějící text.
    label: t(locale, `references.industries.${key}`) || key,
  }))

  const industryLabel = (key: string | null): string | null =>
    key ? (industries.find((item) => item.key === key)?.label ?? key) : null

  // Na klienta jde jen to, co mapa opravdu kreslí - bez těla case study
  // a bez meta polí pro vyhledávače.
  const projects: MapProject[] = references.map((reference) => ({
    id: reference.id,
    slug: reference.slug,
    title: reference.title,
    clientName: reference.clientName,
    year: reference.year,
    industry: reference.industry,
    industryLabel: industryLabel(reference.industry),
    coverImage: reference.coverImage,
    summary: reference.summary,
    tech: reference.tech,
    featured: reference.featured,
    projectUrl: reference.projectUrl,
    testimonial: reference.testimonial,
    testimonialAuthor: reference.testimonialAuthor,
  }))

  const years = references.map((reference) => reference.year).filter((year): year is number => !!year)

  const stats = [
    { value: String(references.length), label: t(locale, 'portfolio.statProjects') },
    {
      value: String(new Set(references.flatMap((reference) => reference.tech)).size),
      label: t(locale, 'portfolio.statTech'),
    },
    { value: String(industries.length), label: t(locale, 'portfolio.statIndustries') },
    ...(years.length > 0
      ? [{ value: `${Math.min(...years)}–${Math.max(...years)}`, label: t(locale, 'portfolio.statYears') }]
      : []),
  ]

  const siteUrl = locale === defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`

  return (
    <main>
      {/* Jeden CreativeWork na referenci. Celé portfolio je jediná URL, takže
          bez nich vidí crawler jednu dlouhou stránku místo seznamu projektů. */}
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

      <header className="fixed inset-x-0 top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <a href={siteUrl} className="group flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="size-7 rounded-lg bg-[linear-gradient(135deg,var(--primary),var(--accent))] shadow-lg transition-transform duration-300 group-hover:rotate-12"
            />
            <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Jabcore
            </span>
            <span className="hidden rounded-full border border-border/70 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground sm:inline">
              {t(locale, 'portfolio.title')}
            </span>
          </a>

          <a
            href={siteUrl}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="hidden sm:inline">{t(locale, 'portfolio.backToSite')}</span>
            <span className="sm:hidden">jabcore.cz</span>
            <ArrowUpRight
              size={14}
              weight="bold"
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </header>

      <PortfolioMap
        projects={projects}
        industries={industries}
        labels={{
          title: t(locale, 'portfolio.title'),
          subtitle: t(locale, 'portfolio.subtitle'),
          all: t(locale, 'references.allIndustries'),
          hint: t(locale, 'portfolio.mapHint'),
          zoomIn: t(locale, 'portfolio.zoomIn'),
          zoomOut: t(locale, 'portfolio.zoomOut'),
          reset: t(locale, 'portfolio.mapReset'),
          expand: t(locale, 'portfolio.mapExpand'),
          collapse: t(locale, 'portfolio.mapCollapse'),
          minimap: t(locale, 'portfolio.mapOverview'),
          region: t(locale, 'portfolio.mapRegion'),
          open: t(locale, 'portfolio.openProject'),
          empty: t(locale, 'references.empty'),
          close: t(locale, 'portfolio.close'),
          client: t(locale, 'references.client'),
          year: t(locale, 'references.year'),
          industry: t(locale, 'references.industry'),
          technologies: t(locale, 'references.technologies'),
          featured: t(locale, 'portfolio.featured'),
          viewProject: t(locale, 'references.viewProject'),
          readCaseStudy: t(locale, 'portfolio.readCaseStudy'),
        }}
      />

      {references.length > 0 && (
        <>
          <section className="border-y border-border/60 bg-secondary/30">
            <div className="container mx-auto grid grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="gradient-text text-4xl font-bold sm:text-5xl"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="container mx-auto px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
              <div className="mb-16 max-w-2xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  {t(locale, 'portfolio.caseStudiesEyebrow')}
                </p>
                <h2
                  className="text-3xl font-bold sm:text-4xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t(locale, 'portfolio.caseStudiesTitle')}
                </h2>
              </div>

              <div className="mx-auto max-w-6xl space-y-24 sm:space-y-32">
                {references.map((reference, index) => (
                  <CaseStudy
                    key={reference.id}
                    reference={reference}
                    index={index}
                    industryLabel={industryLabel(reference.industry)}
                    labels={{
                      client: t(locale, 'references.client'),
                      year: t(locale, 'references.year'),
                      industry: t(locale, 'references.industry'),
                      technologies: t(locale, 'references.technologies'),
                      viewProject: t(locale, 'references.viewProject'),
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <footer className="relative overflow-hidden border-t border-border/60">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]"
        />

        <div className="container relative mx-auto px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
          <h2
            className="mx-auto mb-5 max-w-2xl text-3xl font-bold sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t(locale, 'portfolio.cta')}
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
            {t(locale, 'portfolio.ctaSubtitle')}
          </p>

          <a
            href={`${SITE_URL}/${locale}/contact`}
            className="group inline-flex items-center gap-2 rounded-full bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-8 py-4 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:brightness-110"
          >
            {t(locale, 'portfolio.ctaButton')}
            <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-1" />
          </a>

          <p className="mt-14 text-sm text-muted-foreground">
            <a href={siteUrl} className="transition-colors hover:text-foreground">
              jabcore.cz
            </a>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            © {new Date().getFullYear()} Jabcore
          </p>
        </div>
      </footer>
    </main>
  )
}
