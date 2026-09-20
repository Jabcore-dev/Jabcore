import { generatePageMetadata } from '@/lib/metadata'
import { locales, defaultLocale, type Locale } from '@/lib/i18n-config'
import { t } from '@/lib/server-i18n'
import { getPublishedReferences } from '@/lib/references'
import { skipPrerenderWithoutDatabase } from '@/lib/db-runtime'
import ReferenceCard from '@/components/references/ReferenceCard'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

/**
 * Rebuilt at most once an hour, and immediately when the admin saves - the
 * admin calls revalidatePath on this route. Without the interval a reference
 * published while the server is untouched would wait for the next deploy.
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

  return (
    <div className="pt-16">
      <section className="pt-10 pb-24 sm:pt-14 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1
              className="mb-6 text-5xl font-bold sm:text-6xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t(locale, 'references.title')}
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
              {t(locale, 'references.subtitle')}
            </p>
          </div>

          {references.length === 0 ? (
            <p className="text-center text-muted-foreground">{t(locale, 'references.empty')}</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {references.map((reference) => (
                <ReferenceCard
                  key={reference.id}
                  reference={reference}
                  href={`/${locale}/reference/${reference.slug}`}
                  labels={{ year: t(locale, 'references.year') }}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
