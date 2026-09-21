import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/ssr'
import logo from '@/assets/images/transparent.png'
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
    <main data-block="portfolio">
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

      <header data-block="portfolio-bar">
        <x-wrap>
          <a href={portfolioUrl(locale)} data-brand="">
            {/* Stejné logo jako v navigaci hlavního webu - průhledná varianta,
                která drží v obou režimech. alt je prázdný, protože hned vedle
                stojí název; čtečka by jinak řekla „Jabcore Jabcore". */}
            <Image src={logo} alt="" width={36} height={36} priority />
            <strong>Jabcore</strong>
            <x-flag>{t(locale, 'portfolio.title')}</x-flag>
          </a>

          {/* Doména se nepřekládá, takže ani nejde přes t(). */}
          <a href={siteUrl} data-button="link">
            jabcore.cz
            <ArrowUpRight size={14} weight="bold" />
          </a>
        </x-wrap>
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
          <section data-block="stats">
            <x-wrap>
              {stats.map((stat) => (
                <x-stat key={stat.label}>
                  <x-gradient>{stat.value}</x-gradient>
                  <x-stat-label>{stat.label}</x-stat-label>
                </x-stat>
              ))}
            </x-wrap>
          </section>

          <section data-block="case-studies">
            <x-wrap>
              <x-section-intro>
                <x-eyebrow>{t(locale, 'portfolio.caseStudiesEyebrow')}</x-eyebrow>
                <h2>{t(locale, 'portfolio.caseStudiesTitle')}</h2>
              </x-section-intro>

              <x-case-list>
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
              </x-case-list>
            </x-wrap>
          </section>
        </>
      )}

      <footer data-block="closing-cta" data-size="large">
        <x-glow aria-hidden="true" />
        <x-wrap>
          <h2>{t(locale, 'portfolio.cta')}</h2>
          <p>{t(locale, 'portfolio.ctaSubtitle')}</p>

          <a href={`${SITE_URL}/${locale}/contact`} data-button="solid">
            {t(locale, 'portfolio.ctaButton')}
            <ArrowRight size={18} weight="bold" />
          </a>

          <small>
            <a href={siteUrl}>jabcore.cz</a>
            <span aria-hidden="true"> · </span>© {new Date().getFullYear()} Jabcore
          </small>
        </x-wrap>
      </footer>
    </main>
  )
}
