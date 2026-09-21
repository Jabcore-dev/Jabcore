import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from '@phosphor-icons/react/ssr'
import type { LocalizedReference } from '@/lib/reference-types'

export interface ReferenceCardLabels {
  year: string
  detail: string
  featured: string
}

/**
 * Jedna reference v přehledu.
 *
 * Serverová komponenta schválně: karta je text a jeden obrázek, takže poslaná
 * jako hotové HTML zůstane obsah ve stránce pro vyhledávače a návštěvníka
 * nestojí ani řádek JavaScriptu. Všechno, co se hýbe, je přechod v CSS.
 *
 * Dvě podoby téhož se liší jen atributem `data-layout`: `card` do mřížky,
 * `wide` pro jeden vypíchnutý projekt nad ní. Kdyby to byly dvě komponenty,
 * rozejdou se při prvním zásahu do stylu - takhle sdílí obrázek i popisky.
 */
export default function ReferenceCard({
  reference,
  href,
  labels,
  layout = 'card',
  priority = false,
}: {
  reference: LocalizedReference
  href: string
  labels: ReferenceCardLabels
  layout?: 'card' | 'wide'
  /** Jen pro první kartu nad ohybem - jinak by se přednačítala celá mřížka. */
  priority?: boolean
}) {
  const wide = layout === 'wide'
  const shown = wide ? 6 : 4

  return (
    <x-reference-card data-layout={layout}>
      <Link href={href}>
        {/* Barevný nádech, který se rozsvítí až pod kurzorem - karta v klidu
            zůstane tichá a mřížka nevypadá jako světelná tabule. */}
        <x-card-glow aria-hidden="true" />

        <x-card-media>
          {reference.coverImage ? (
            <Image
              src={reference.coverImage}
              alt=""
              fill
              sizes={
                wide
                  ? '(min-width: 1024px) 50vw, 100vw'
                  : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
              }
              priority={priority}
            />
          ) : (
            <x-card-blank />
          )}

          {/* Ztmavení jen u spodní hrany, aby na obrázku držel bílý text. */}
          <x-card-scrim aria-hidden="true" />

          <x-card-meta>
            <span>{reference.clientName}</span>
            {reference.year && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  <x-sr>{labels.year}: </x-sr>
                  {reference.year}
                </span>
              </>
            )}
          </x-card-meta>

          {reference.featured && <x-card-flag>{labels.featured}</x-card-flag>}
        </x-card-media>

        <x-card-body>
          <h3>{reference.title}</h3>

          {reference.summary && <p>{reference.summary}</p>}

          {reference.tech.length > 0 && (
            <x-tags>
              {/* Čtyři štítky se vejdou na řádek karty; víc by roztáhlo všechny
                  karty v řadě do výšky té nejukecanější. */}
              {reference.tech.slice(0, shown).map((tech) => (
                <x-tag key={tech}>{tech}</x-tag>
              ))}
              {reference.tech.length > shown && (
                <x-tag data-rest="">+{reference.tech.length - shown}</x-tag>
              )}
            </x-tags>
          )}

          <x-card-more>
            {labels.detail}
            <ArrowRight size={15} weight="bold" />
          </x-card-more>
        </x-card-body>
      </Link>
    </x-reference-card>
  )
}
