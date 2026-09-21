'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ArrowUpRight, ArrowDown, Quotes } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { MapProject } from '@/lib/portfolio-map'

export interface PanelLabels {
  close: string
  client: string
  year: string
  industry: string
  technologies: string
  featured: string
  viewProject: string
  readCaseStudy: string
}

/**
 * Vysunutý detail projektu.
 *
 * Na mapě je to hlavní obrazovka prodeje: obchodník klikne na bublinu a má na
 * jednom místě obrázek, jednu větu o zadání, technologie a referenci klienta.
 * Celá case study se sem záměrně netahá - je pod mapou jako čitelný text
 * a tlačítko na ni odroluje, takže se stejný obsah neposílá do stránky dvakrát.
 *
 * Vpravo na monitoru, zespoda na telefonu - v obou případech tak, aby mapa
 * zůstala aspoň zčásti vidět a bylo poznat, odkud se panel vzal.
 */
export default function ProjectPanel({
  project,
  labels,
  onClose,
  onReadCaseStudy,
}: {
  project: MapProject | null
  labels: PanelLabels
  onClose: () => void
  onReadCaseStudy: (slug: string) => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!project) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    // Čtečka i klávesnice musí skončit v panelu, ne někde na mapě za ním.
    panelRef.current?.focus()

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [project, onClose])

  return (
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 z-30 bg-background/40 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <motion.div
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={project.title}
            tabIndex={-1}
            initial={{ opacity: 0, x: 40, y: 40 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 24, y: 24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="absolute inset-x-3 bottom-3 z-40 flex max-h-[72%] flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/85 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.55)] backdrop-blur-2xl outline-none sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-5 sm:max-h-[calc(100%-2.5rem)] sm:w-[26rem] lg:w-[29rem]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={labels.close}
              className="absolute right-4 top-4 z-10 grid size-9 cursor-pointer place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/70"
            >
              <X size={16} weight="bold" />
            </button>

            <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted">
              {project.coverImage ? (
                <Image
                  src={project.coverImage}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 29rem, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(140deg,var(--primary),var(--accent))]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/55 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {project.featured && (
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-accent-foreground">
                      {labels.featured}
                    </span>
                  )}
                  {project.industryLabel && (
                    <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                      {project.industryLabel}
                    </span>
                  )}
                </div>

                <h2
                  className="text-2xl font-bold leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {project.title}
                </h2>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4">
              <dl className="mb-5 grid grid-cols-2 gap-4 border-b border-border/60 pb-5 text-sm">
                <div>
                  <dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {labels.client}
                  </dt>
                  <dd className="font-medium">{project.clientName}</dd>
                </div>
                {project.year && (
                  <div>
                    <dt className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                      {labels.year}
                    </dt>
                    <dd className="font-medium">{project.year}</dd>
                  </div>
                )}
              </dl>

              {project.summary && (
                <p className="mb-5 text-[0.95rem] leading-relaxed text-muted-foreground">
                  {project.summary}
                </p>
              )}

              {project.tech.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                    {labels.technologies}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tech.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-border/70 bg-secondary/60 px-2.5 py-1 text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.testimonial && (
                <blockquote className="relative mb-5 rounded-2xl border border-border/60 bg-secondary/40 p-4 pt-8">
                  <Quotes
                    size={22}
                    weight="fill"
                    className="absolute left-4 top-3 text-accent/60"
                    aria-hidden="true"
                  />
                  <p className="text-sm italic leading-relaxed">{project.testimonial}</p>
                  {project.testimonialAuthor && (
                    <footer className="mt-2 text-xs text-muted-foreground">
                      {project.testimonialAuthor}
                    </footer>
                  )}
                </blockquote>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/60 bg-background/40 p-4">
              <Button
                className="flex-1 cursor-pointer"
                onClick={() => onReadCaseStudy(project.slug)}
              >
                {labels.readCaseStudy}
                <ArrowDown size={15} weight="bold" />
              </Button>

              {project.projectUrl && (
                <Button asChild variant="outline" className="cursor-pointer">
                  <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                    {labels.viewProject}
                    <ArrowUpRight size={15} weight="bold" />
                  </a>
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
