import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react/ssr'
import { t } from '@/lib/server-i18n'
import { getPublishedReferences } from '@/lib/references'
import { skipPrerenderWithoutDatabase } from '@/lib/db-runtime'
import { defaultLocale, type Locale } from '@/lib/i18n-config'
import { PORTFOLIO_URL } from '@/lib/site-config'
import ReferenceCard from './ReferenceCard'
import ReferenceRail from './ReferenceRail'

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

  const portfolioUrl = locale === defaultLocale ? PORTFOLIO_URL : `${PORTFOLIO_URL}/${locale}`

  return (
    <section data-block="references-preview">
      <x-glow aria-hidden="true" />

      <x-wrap>
        <x-section-head>
          <x-section-intro>
            <x-eyebrow>{t(locale, 'references.eyebrow')}</x-eyebrow>
            <h2>{t(locale, 'references.previewTitle')}</h2>
            <p>{t(locale, 'references.previewSubtitle')}</p>
          </x-section-intro>

          <x-actions>
            <Link href={`/${locale}/reference`} data-button="ghost">
              {t(locale, 'references.previewCta')}
              <ArrowRight size={15} weight="bold" />
            </Link>
            {/* Portfolio je samostatný web - v novém okně, ať návštěvník
                nepřijde o homepage. */}
            <a href={portfolioUrl} target="_blank" rel="noopener" data-button="link">
              {t(locale, 'references.portfolioLink')}
              <ArrowUpRight size={15} weight="bold" />
            </a>
          </x-actions>
        </x-section-head>

        <ReferenceRail slideLabel={t(locale, 'references.carouselSlide')}>
          {references.map((reference) => (
            <ReferenceCard
              key={reference.id}
              reference={reference}
              href={`/${locale}/reference/${reference.slug}`}
              labels={labels}
              showFeatured={false}
            />
          ))}
        </ReferenceRail>
      </x-wrap>
    </section>
  )
}
