import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/ssr'
import { t } from '@/lib/server-i18n'
import { getPublishedReferences } from '@/lib/references'
import { skipPrerenderWithoutDatabase } from '@/lib/db-runtime'
import type { Locale } from '@/lib/i18n-config'
import ReferenceCard from './ReferenceCard'

/**
 * Tři reference na homepage, prolinkované na celý seznam.
 *
 * Asynchronní serverová komponenta, takže karty jsou v HTML, které dostane
 * crawler. Když není co ukázat, nevykreslí se vůbec nic - sekce s nadpisem
 * a prázdnou mřížkou vypadá jako rozbitá stránka.
 */
export default async function ReferencesPreview({ locale }: { locale: Locale }) {
  // Bez tohohle by se homepage předrenderovala při buildu image, kde databáze
  // není, a pak se servírovala z cache bez jediné reference až do příští
  // revalidace.
  await skipPrerenderWithoutDatabase()

  let references: Awaited<ReturnType<typeof getPublishedReferences>> = []

  try {
    references = (await getPublishedReferences(locale)).slice(0, 3)
  } catch (error) {
    // Homepage se musí vykreslit i s nedostupnou databází; tahle sekce je
    // jediná část, která na ní visí.
    console.error('ReferencesPreview: načtení referencí selhalo', error)
    return null
  }

  if (references.length === 0) return null

  const labels = {
    year: t(locale, 'references.year'),
    detail: t(locale, 'references.viewDetail'),
    featured: t(locale, 'references.featuredLabel'),
  }

  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]"
      />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col gap-6 sm:mb-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {t(locale, 'references.eyebrow')}
            </p>
            <h2
              className="text-4xl font-bold leading-tight sm:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t(locale, 'references.previewTitle')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              {t(locale, 'references.previewSubtitle')}
            </p>
          </div>

          <Link
            href={`/${locale}/reference`}
            className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:border-accent/60 hover:bg-accent/10 lg:self-auto"
          >
            {t(locale, 'references.previewCta')}
            <ArrowRight
              size={15}
              weight="bold"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {references.map((reference) => (
            <ReferenceCard
              key={reference.id}
              reference={reference}
              href={`/${locale}/reference/${reference.slug}`}
              labels={labels}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
