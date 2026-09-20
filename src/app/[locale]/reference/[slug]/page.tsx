import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound, permanentRedirect } from 'next/navigation'
import { marked } from 'marked'
import { locales, defaultLocale, ogLocales, type Locale } from '@/lib/i18n-config'
import { t } from '@/lib/server-i18n'
import { SITE_URL } from '@/lib/site-config'
import { getReferenceBySlug, getPublishedSlugs, findRedirectTarget } from '@/lib/references'
import { skipPrerenderWithoutDatabase, hasDatabase } from '@/lib/db-runtime'
import { buildReferenceJsonLd } from '@/lib/jsonld'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

/**
 * Prerenders every published reference in every language at build time; new
 * ones are rendered on first request and then cached, so publishing from the
 * admin does not need a deploy.
 */
export async function generateStaticParams() {
  // No database during the image build: every slug is then rendered on first
  // request instead, and cached from there.
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

  return (
    <article className="pt-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/${locale}/reference`}
            className="mb-8 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {t(locale, 'references.backToList')}
          </Link>

          <h1
            className="mb-6 text-4xl font-bold sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {reference.title}
          </h1>

          {reference.summary && (
            <p className="mb-10 text-xl text-muted-foreground">{reference.summary}</p>
          )}

          <dl className="mb-12 grid grid-cols-2 gap-6 border-y border-border py-6 sm:grid-cols-4">
            <div>
              <dt className="mb-1 text-sm text-muted-foreground">{t(locale, 'references.client')}</dt>
              <dd className="font-medium">{reference.clientName}</dd>
            </div>
            {reference.year && (
              <div>
                <dt className="mb-1 text-sm text-muted-foreground">{t(locale, 'references.year')}</dt>
                <dd className="font-medium">{reference.year}</dd>
              </div>
            )}
            {reference.tech.length > 0 && (
              <div className="col-span-2">
                <dt className="mb-1 text-sm text-muted-foreground">
                  {t(locale, 'references.technologies')}
                </dt>
                <dd className="flex flex-wrap gap-2">
                  {reference.tech.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {reference.coverImage && (
        <div className="container mx-auto mb-16 px-4 sm:px-6 lg:px-8">
          <div className="relative mx-auto aspect-[16/9] max-w-5xl overflow-hidden rounded-lg bg-muted">
            <Image
              src={reference.coverImage}
              alt={reference.title}
              fill
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {bodyHtml && (
            <div
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          )}

          {reference.testimonial && (
            <blockquote className="mt-12 border-l-4 border-primary py-2 pl-6">
              <p className="mb-3 text-lg italic">{reference.testimonial}</p>
              {reference.testimonialAuthor && (
                <footer className="text-sm text-muted-foreground">
                  - {reference.testimonialAuthor}
                </footer>
              )}
            </blockquote>
          )}

          {reference.projectUrl && (
            <div className="mt-12">
              <Button asChild size="lg">
                <a href={reference.projectUrl} target="_blank" rel="noopener noreferrer">
                  {t(locale, 'references.viewProject')} ↗
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
