import Link from 'next/link'
import { t } from '@/lib/server-i18n'
import { getPublishedReferences } from '@/lib/references'
import { skipPrerenderWithoutDatabase } from '@/lib/db-runtime'
import type { Locale } from '@/lib/i18n-config'
import { Button } from '@/components/ui/button'
import ReferenceCard from './ReferenceCard'

/**
 * Three references on the homepage, linking through to the full listing.
 *
 * Async server component, so the cards are in the HTML the crawler gets. It
 * renders nothing at all when there is nothing published - an empty section
 * with a heading and no content looks broken.
 */
export default async function ReferencesPreview({ locale }: { locale: Locale }) {
  // Without this the homepage would be prerendered during the image build,
  // where there is no database, and then served from cache with no references
  // on it until the next revalidation.
  await skipPrerenderWithoutDatabase()

  let references: Awaited<ReturnType<typeof getPublishedReferences>> = []

  try {
    references = (await getPublishedReferences(locale)).slice(0, 3)
  } catch (error) {
    // The homepage must render even when the database is unreachable; this
    // section is the only part that depends on it.
    console.error('ReferencesPreview: načtení referencí selhalo', error)
    return null
  }

  if (references.length === 0) return null

  return (
    <section className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2
            className="mb-6 text-4xl font-bold sm:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t(locale, 'references.previewTitle')}
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            {t(locale, 'references.previewSubtitle')}
          </p>
        </div>

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

        <div className="mt-12 text-center">
          <Button asChild size="lg" variant="outline">
            <Link href={`/${locale}/reference`}>{t(locale, 'references.previewCta')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
