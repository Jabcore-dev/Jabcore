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
    <article className="pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Titulka přes celou šířku. Obrázek reference je to jediné, co o
          projektu něco řekne dřív, než se začne číst - tak ať je vidět dřív
          než metadata. */}
      <header className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {reference.coverImage ? (
            <>
              <Image
                src={reference.coverImage}
                alt=""
                fill
                sizes="100vw"
                priority
                className="object-cover"
              />
              {/* Dvě clony místo jedné: vodorovná drží čitelný text vlevo,
                  svislá sešívá obrázek s pozadím stránky. Jedna společná by
                  musela být tak tmavá, že by z fotky nezbylo nic. */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/25" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-background/55" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/15" />
              <div className="absolute -left-20 top-0 h-[24rem] w-[24rem] rounded-full bg-primary/20 blur-[120px]" />
              <div className="absolute -right-16 bottom-0 h-[22rem] w-[22rem] rounded-full bg-accent/20 blur-[120px]" />
            </>
          )}
        </div>

        <div className="container mx-auto px-4 pb-20 pt-12 sm:px-6 sm:pb-32 sm:pt-20 lg:px-8">
          <Link
            href={`/${locale}/reference`}
            className="group mb-10 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft
              size={15}
              weight="bold"
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            {t(locale, 'references.backToList')}
          </Link>

          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {reference.featured && (
                <span className="rounded-full bg-accent px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-accent-foreground">
                  {t(locale, 'references.featuredLabel')}
                </span>
              )}
              {industryLabel && (
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                  {industryLabel}
                </span>
              )}
            </div>

            <h1
              className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {reference.title}
            </h1>

            {reference.summary && (
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                {reference.summary}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Karta s fakty zajíždí do titulky - sešije obrázek s textem, aby
            hlavička nekončila prázdnou hranou. */}
        <dl className="-mt-12 grid grid-cols-2 gap-6 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-xl backdrop-blur-xl sm:grid-cols-4 sm:p-8">
          <div>
            <dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
              {t(locale, 'references.client')}
            </dt>
            <dd className="font-semibold">{reference.clientName}</dd>
          </div>

          {reference.year && (
            <div>
              <dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                {t(locale, 'references.year')}
              </dt>
              <dd className="font-semibold">{reference.year}</dd>
            </div>
          )}

          {reference.tech.length > 0 && (
            <div className="col-span-2">
              <dt className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                {t(locale, 'references.technologies')}
              </dt>
              <dd className="flex flex-wrap gap-1.5">
                {reference.tech.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border/70 bg-secondary/60 px-2.5 py-1 text-xs font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className="container mx-auto px-4 pb-24 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="max-w-3xl">
          {bodyHtml && <div className="richtext" dangerouslySetInnerHTML={{ __html: bodyHtml }} />}

          {reference.testimonial && (
            <blockquote className="relative mt-14 overflow-hidden rounded-3xl border border-border/60 bg-secondary/40 p-7 pt-14 sm:p-10 sm:pt-16">
              <Quotes
                size={40}
                weight="fill"
                className="absolute left-7 top-6 text-accent/50 sm:left-10"
                aria-hidden="true"
              />
              <p className="text-lg italic leading-relaxed sm:text-xl">{reference.testimonial}</p>
              {reference.testimonialAuthor && (
                <footer className="mt-5 text-sm font-medium text-muted-foreground">
                  {reference.testimonialAuthor}
                </footer>
              )}
            </blockquote>
          )}

          {reference.projectUrl && (
            <div className="mt-12">
              <a
                href={reference.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold transition-colors hover:border-accent/60 hover:bg-accent/10"
              >
                {t(locale, 'references.viewProject')}
                <ArrowUpRight
                  size={16}
                  weight="bold"
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          )}
        </div>
      </div>

      <section className="border-t border-border/60 bg-secondary/30">
        <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2
            className="max-w-2xl text-2xl font-bold sm:text-3xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t(locale, 'references.ctaTitle')}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${locale}/contact`}
              className="group inline-flex items-center gap-2 rounded-full bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-7 py-3.5 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:brightness-110"
            >
              {t(locale, 'references.ctaButton')}
              <ArrowRight
                size={16}
                weight="bold"
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <Link
              href={`/${locale}/reference`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              {t(locale, 'references.backToList')}
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}
