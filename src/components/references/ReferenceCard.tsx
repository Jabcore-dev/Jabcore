import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from '@phosphor-icons/react/ssr'
import { cn } from '@/lib/utils'
import type { LocalizedReference } from '@/lib/reference-types'

export interface ReferenceCardLabels {
  year: string
  detail: string
  featured: string
}

/**
 * Jedna reference v přehledu.
 *
 * Serverová komponenta schválně: karta je text a jeden obrázek, takže
 * poslaná jako hotové HTML zůstane obsah ve stránce pro vyhledávače a
 * návštěvníka nestojí ani řádek JavaScriptu. Všechno, co se hýbe, je CSS
 * přechod nad `group`.
 *
 * Dvě podoby téhož: `card` do mřížky, `wide` pro jeden vypíchnutý projekt
 * nad ní. Kdyby to byly dvě komponenty, rozejdou se při prvním zásahu do
 * stylu - takhle sdílí obrázek, popisky i hover.
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

  return (
    <Link
      href={href}
      className={cn(
        'group relative block overflow-hidden rounded-3xl border border-border/70 bg-card',
        'transition-all duration-500 ease-out',
        'hover:-translate-y-1 hover:border-accent/50 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        wide ? 'grid lg:grid-cols-2' : 'flex h-full flex-col',
      )}
    >
      {/* Barevný nádech, který se rozsvítí až pod kurzorem - karta v klidu
          zůstane tichá a mřížka nevypadá jako světelná tabule. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, color-mix(in oklch, var(--accent) 16%, transparent), transparent 60%)',
        }}
      />

      <div
        className={cn(
          'relative overflow-hidden bg-muted',
          wide ? 'aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[22rem]' : 'aspect-[16/10]',
        )}
      >
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
            className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(140deg,var(--primary),var(--accent))] opacity-90" />
        )}

        {/* Ztmavení jen u spodní hrany, aby na obrázku držel bílý text. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-x-2 gap-y-1 p-4 text-xs font-medium text-white/90 sm:p-5">
          <span className="uppercase tracking-wider">{reference.clientName}</span>
          {reference.year && (
            <>
              <span aria-hidden="true" className="text-white/50">
                ·
              </span>
              <span>
                <span className="sr-only">{labels.year}: </span>
                {reference.year}
              </span>
            </>
          )}
        </div>

        {reference.featured && (
          <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-accent-foreground shadow-lg sm:left-5 sm:top-5">
            {labels.featured}
          </span>
        )}
      </div>

      <div
        className={cn(
          'relative z-10 flex flex-1 flex-col p-6',
          wide && 'justify-center p-8 sm:p-10 lg:p-12',
        )}
      >
        <h3
          className={cn(
            'font-bold leading-tight transition-colors duration-300 group-hover:text-primary',
            wide ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-xl',
          )}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {reference.title}
        </h3>

        {reference.summary && (
          <p
            className={cn(
              'mt-3 text-muted-foreground',
              wide ? 'text-base sm:text-lg' : 'line-clamp-3 text-[0.95rem] leading-relaxed',
            )}
          >
            {reference.summary}
          </p>
        )}

        {reference.tech.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {/* Čtyři štítky se vejdou na řádek; víc by roztáhlo všechny karty
                v řadě do výšky nejukecanější z nich. */}
            {reference.tech.slice(0, wide ? 6 : 4).map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-border/70 bg-secondary/60 px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                {tech}
              </span>
            ))}
            {reference.tech.length > (wide ? 6 : 4) && (
              <span className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
                +{reference.tech.length - (wide ? 6 : 4)}
              </span>
            )}
          </div>
        )}

        <span
          className={cn(
            'mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors duration-300 group-hover:text-accent',
            !wide && 'mt-auto pt-6',
          )}
        >
          {labels.detail}
          <ArrowRight
            size={15}
            weight="bold"
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  )
}
