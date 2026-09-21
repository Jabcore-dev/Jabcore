import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound, permanentRedirect } from 'next/navigation'
import { marked } from 'marked'
import { ArrowLeft, ArrowRight, ArrowUpRight, Quotes } from '@phosphor-icons/react/ssr'
import { locales, defaultLocale, ogLocales, type Locale } from '@/lib/i18n-config'
import { t } from '@/lib/server-i18n'
import { SITE_URL } from '@/lib/site-config'
import { getReferenceBySlug, getPublishedSlugs, findRedirectTarget } from '@/lib/references'
import { skipPrerenderWithoutDatabase, hasDatabase } from '@/lib/db-runtime'
import { buildReferenceJsonLd } from '@/lib/jsonld'

/**
 * Předgeneruje každou publikovanou referenci v každém jazyce při buildu; nové
 * se vykreslí při prvním požadavku a pak se cachují, takže publikování
 * z adminu nepotřebuje nasazení.
 */
export async function generateStaticParams() {
  // Při buildu image databáze není: každý slug se pak vykreslí až při prvním
  // požadavku a odtamtud se cachuje.
  if (!hasDatabase()) return []

  const slugs = await getPublishedSlugs()
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export const revalidate = 3600

function resolveLocale(raw: string): Locale {
  return (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)
  const reference = await getReferenceBySlug(slug, locale)

  if (!reference) return {}

  const url = `${SITE_URL}/${locale}/reference/${slug}`

  /*
   * Vlastní texty z adminu mají přednost. Perex je psaný pro čtenáře na kartě,
   * meta description pro někoho, kdo se rozhoduje ve výsledcích vyhledávání -
   * když si to editor rozliší, respektujeme to.
   */
  const metaTitle = reference.metaTitle?.trim() || reference.title
  const description = reference.metaDescription?.trim() || reference.summary || undefined
  const image = reference.coverImage ? `${SITE_URL}${reference.coverImage}` : `${SITE_URL}/og-image.png`

  /*
   * hreflang across every locale: the page exists in all of them thanks to the
   * per-field fallback in getReferenceBySlug, so pointing at only the
   * translated ones would hide the rest from search engines.
   */
  const languages: Record<string, string> = {}
  for (const loc of locales) {
    languages[loc] = `${SITE_URL}/${loc}/reference/${slug}`
  }
  languages['x-default'] = `${SITE_URL}/${defaultLocale}/reference/${slug}`

  return {
    /*
     * Vlastní titulek z adminu je absolutní - layout na title lepí šablonu
     * "%s | Jabcore", takže když si do něj editor napíše značku sám, vznikne
     * "… | Jabcore | Jabcore". Když pole nechá prázdné, šablona se uplatní
     * jako u ostatních stránek.
     */
    title: reference.metaTitle?.trim() ? { absolute: metaTitle } : metaTitle,
    description,
    // Viditelné na webu, ale mimo výsledky vyhledávání.
    ...(reference.noindex ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: url, languages },
    openGraph: {
      title: metaTitle,
      description,
      url,
      siteName: 'Jabcore',
      locale: ogLocales[locale] ?? 'cs_CZ',
      type: 'article',
      images: [{ url: image, width: 1200, height: 630, alt: reference.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description,
      images: [image],
    },
  }
}

export default async function ReferenceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale = resolveLocale(rawLocale)

  await skipPrerenderWithoutDatabase()
  const reference = await getReferenceBySlug(slug, locale)

  if (!reference) {
    /*
     * Než vrátíme 404: slug se mohl v adminu přejmenovat. Stará adresa je
     * mezitím odněkud prolinkovaná a zaindexovaná, takže ji pošleme 301 na
     * novou - jinak přijdeme o návštěvníky i o hodnocení, které si vysloužila.
     */
    const target = await findRedirectTarget(slug)
    if (target) permanentRedirect(`/${locale}/reference/${target}`)

    // Pokrývá neexistující i nepublikovaný slug - getReferenceBySlug filtruje
    // na published, takže rozepsaná reference je 404, ne náhled.
    notFound()
  }

  /*
   * Markdown written by the admins in the editor. They are trusted internal
   * users, so the HTML is rendered as-is; if editing ever opens up beyond the
   * team, this is the line that needs a sanitizer.
   */
  const bodyHtml = reference.body ? await marked.parse(reference.body) : null

  const jsonLd = buildReferenceJsonLd(reference, `${SITE_URL}/${locale}/reference/${slug}`)

  const industryLabel = reference.industry
    ? t(locale, `references.industries.${reference.industry}`) || reference.industry
    : null

  return (
    <article data-block="reference-detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Titulka přes celou šířku. Obrázek reference je to jediné, co o
          projektu něco řekne dřív, než se začne číst - tak ať je vidět dřív
          než metadata. */}
      <header>
        <x-hero-media aria-hidden="true">
          {reference.coverImage ? (
            <>
              <Image src={reference.coverImage} alt="" fill sizes="100vw" priority />
              {/* Dvě clony místo jedné: vodorovná drží čitelný text vlevo,
                  svislá sešívá obrázek s pozadím stránky. Jedna společná by
                  musela být tak tmavá, že by z fotky nezbylo nic. */}
              <x-hero-scrim data-axis="x" />
              <x-hero-scrim data-axis="y" />
            </>
          ) : (
            <>
              <x-hero-blank />
              <x-glow data-side="left" />
              <x-glow data-side="right" />
            </>
          )}
        </x-hero-media>

        <x-wrap>
          <Link href={`/${locale}/reference`} data-button="back">
            <ArrowLeft size={15} weight="bold" />
            {t(locale, 'references.backToList')}
          </Link>

          <x-flags>
            {reference.featured && (
              <x-flag data-tone="accent">{t(locale, 'references.featuredLabel')}</x-flag>
            )}
            {industryLabel && <x-flag>{industryLabel}</x-flag>}
          </x-flags>

          <h1>{reference.title}</h1>

          {reference.summary && <p>{reference.summary}</p>}
        </x-wrap>
      </header>

      <x-wrap>
        {/* Karta s fakty zajíždí do titulky - sešije obrázek s textem, aby
            hlavička nekončila prázdnou hranou. */}
        <dl data-block="fact-card">
          <x-fact>
            <dt>{t(locale, 'references.client')}</dt>
            <dd>{reference.clientName}</dd>
          </x-fact>

          {reference.year && (
            <x-fact>
              <dt>{t(locale, 'references.year')}</dt>
              <dd>{reference.year}</dd>
            </x-fact>
          )}

          {reference.tech.length > 0 && (
            <x-fact data-span="2">
              <dt>{t(locale, 'references.technologies')}</dt>
              <dd>
                <x-tags>
                  {reference.tech.map((tech) => (
                    <x-tag key={tech}>{tech}</x-tag>
                  ))}
                </x-tags>
              </dd>
            </x-fact>
          )}
        </dl>

        <x-prose>
          {bodyHtml && <x-richtext dangerouslySetInnerHTML={{ __html: bodyHtml }} />}

          {reference.testimonial && (
            <blockquote>
              <Quotes size={40} weight="fill" aria-hidden="true" />
              <p>{reference.testimonial}</p>
              {reference.testimonialAuthor && <footer>{reference.testimonialAuthor}</footer>}
            </blockquote>
          )}

          {reference.projectUrl && (
            <x-actions>
              <a href={reference.projectUrl} target="_blank" rel="noopener noreferrer" data-button="ghost">
                {t(locale, 'references.viewProject')}
                <ArrowUpRight size={16} weight="bold" />
              </a>
            </x-actions>
          )}
        </x-prose>
      </x-wrap>

      <section data-block="closing-cta">
        <x-wrap>
          <h2>{t(locale, 'references.ctaTitle')}</h2>
          <x-actions>
            <Link href={`/${locale}/contact`} data-button="solid">
              {t(locale, 'references.ctaButton')}
              <ArrowRight size={16} weight="bold" />
            </Link>
            <Link href={`/${locale}/reference`} data-button="ghost">
              {t(locale, 'references.backToList')}
            </Link>
          </x-actions>
        </x-wrap>
      </section>
    </article>
  )
}
