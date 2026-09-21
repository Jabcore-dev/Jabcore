import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowUpRight } from '@phosphor-icons/react/ssr'
import logo from '@/assets/images/transparent.png'
import { locales, defaultLocale, ogLocales, type Locale } from '@/lib/i18n-config'
import { t, plural } from '@/lib/server-i18n'
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
 * Jedna obrazovka bez rolování: tenká lišta s logem, nadpisem a čísly, pod ní
 * mapa bublin přes zbytek okna. Detail projektu se otevírá v modálním okně.
 *
 * Case studies se renderují tady na serveru a mapa je dostane hotové
 * (`details`). Leží v dialogu i když je zavřený, takže celý text je v HTML
 * pro vyhledávač, přestože ho návštěvník uvidí až po kliknutí.
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

  /*
   * Každý obor dostane vlastní odstín. Podle pořadí v seřazeném seznamu, ne
   * podle hashe názvu: hash by dvěma oborům klidně přidělil skoro stejnou
   * barvu, pořadí je rozprostře po paletě rovnoměrně.
   */
  const HUES = [195, 255, 300, 25, 145, 70, 340, 170]
  const DEFAULT_HUE = 195

  const industries = industryKeys.map((key, index) => ({
    key,
    // Když obor ještě nemá překlad, radši ukázat holý klíč než chybějící text.
    label: t(locale, `references.industries.${key}`) || key,
    hue: HUES[index % HUES.length],
  }))

  const industryOf = (key: string | null) =>
    key ? industries.find((item) => item.key === key) : undefined

  // Na klienta jde jen to, co mapa opravdu kreslí - tělo case study a meta
  // pole pro vyhledávače zůstávají na serveru.
  const projects: MapProject[] = references.map((reference) => ({
    id: reference.id,
    slug: reference.slug,
    title: reference.title,
    clientName: reference.clientName,
    year: reference.year,
    industry: reference.industry,
    industryLabel: industryOf(reference.industry)?.label ?? reference.industry,
    hue: industryOf(reference.industry)?.hue ?? DEFAULT_HUE,
    coverImage: reference.coverImage,
    summary: reference.summary,
    tech: reference.tech,
    featured: reference.featured,
    projectUrl: reference.projectUrl,
    testimonial: reference.testimonial,
    testimonialAuthor: reference.testimonialAuthor,
  }))

  const years = references.map((reference) => reference.year).filter((year): year is number => !!year)
  const techCount = new Set(references.flatMap((reference) => reference.tech)).size
  const firstYear = Math.min(...years)
  const lastYear = Math.max(...years)

  /*
   * Nula se neukazuje: „0 oborů" nic neříká a působí, jako by něco chybělo.
   * Stejně tak rozmezí z jediného roku („2023–2023") se zkrátí na rok.
   */
  const stats = [
    { value: references.length, label: plural(locale, 'portfolio.stats.projects', references.length) },
    { value: techCount, label: plural(locale, 'portfolio.stats.tech', techCount) },
    { value: industries.length, label: plural(locale, 'portfolio.stats.industries', industries.length) },
  ]
    .filter((stat) => stat.value > 0)
    .map((stat) => ({ value: String(stat.value), label: stat.label }))

  if (years.length > 0) {
    stats.push({
      value: firstYear === lastYear ? String(firstYear) : `${firstYear}–${lastYear}`,
      label: '',
    })
  }

  const contactUrl = `${SITE_URL}/${locale}/contact`

  const caseLabels = {
    client: t(locale, 'references.client'),
    year: t(locale, 'references.year'),
    industry: t(locale, 'references.industry'),
    technologies: t(locale, 'references.technologies'),
    viewProject: t(locale, 'references.viewProject'),
    featured: t(locale, 'references.featuredLabel'),
    cta: t(locale, 'portfolio.cta'),
    ctaButton: t(locale, 'portfolio.ctaButton'),
  }

  const details = Object.fromEntries(
    references.map((reference) => [
      reference.slug,
      <CaseStudy
        key={reference.slug}
        reference={reference}
        industryLabel={industryOf(reference.industry)?.label ?? null}
        hue={industryOf(reference.industry)?.hue ?? DEFAULT_HUE}
        contactUrl={contactUrl}
        labels={caseLabels}
      />,
    ]),
  )

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

      {/* Co nejtenčí lišta: všechno ostatní místo patří mapě. */}
      <header data-block="portfolio-bar">
        <a href={portfolioUrl(locale)} data-brand="">
          {/* Stejné logo jako v navigaci hlavního webu - průhledná varianta,
              která drží v obou režimech. alt je prázdný, protože hned vedle
              stojí název; čtečka by jinak řekla „Jabcore Jabcore". */}
          <Image src={logo} alt="" width={30} height={30} priority />
          <strong>Jabcore</strong>
        </a>

        <h1>
          <x-gradient>{t(locale, 'portfolio.title')}</x-gradient>
        </h1>

        {stats.length > 0 && (
          <x-stats>
            {stats.map((stat) => (
              <x-stat key={stat.value + stat.label}>
                <x-gradient>{stat.value}</x-gradient>
                {stat.label && <x-stat-label>{stat.label}</x-stat-label>}
              </x-stat>
            ))}
          </x-stats>
        )}

        <x-bar-actions>
          <a href={contactUrl} data-button="solid">
            {t(locale, 'portfolio.ctaButton')}
          </a>
          {/* Doména se nepřekládá, takže ani nejde přes t(). */}
          <a href={siteUrl} data-button="link">
            jabcore.cz
            <ArrowUpRight size={13} weight="bold" />
          </a>
        </x-bar-actions>
      </header>

      <PortfolioMap
        projects={projects}
        industries={industries}
        details={details}
        labels={{
          all: t(locale, 'references.allIndustries'),
          hint: t(locale, 'portfolio.mapHint'),
          zoomIn: t(locale, 'portfolio.zoomIn'),
          zoomOut: t(locale, 'portfolio.zoomOut'),
          reset: t(locale, 'portfolio.mapReset'),
          fullscreen: t(locale, 'portfolio.mapExpand'),
          exitFullscreen: t(locale, 'portfolio.mapCollapse'),
          minimap: t(locale, 'portfolio.mapOverview'),
          region: t(locale, 'portfolio.mapRegion'),
          open: t(locale, 'portfolio.openProject'),
          empty: t(locale, 'references.empty'),
          close: t(locale, 'portfolio.close'),
          previous: t(locale, 'portfolio.previous'),
          next: t(locale, 'portfolio.next'),
        }}
      />
    </main>
  )
}
