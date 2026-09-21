'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { AnimatePresence } from 'framer-motion'
import { X, ArrowUpRight, ArrowDown, Quotes } from '@phosphor-icons/react'
import type { MapProject } from '@/lib/portfolio-map'
import { motionElement } from './motion-element'

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

const Scrim = motionElement('x-panel-scrim')
const Panel = motionElement('x-panel')

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
          <Scrim
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <Panel
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
          >
            <button type="button" onClick={onClose} aria-label={labels.close} data-button="close">
              <X size={16} weight="bold" />
            </button>

            <x-panel-cover>
              {project.coverImage ? (
                <Image
                  src={project.coverImage}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 29rem, 100vw"
                />
              ) : (
                <x-panel-blank />
              )}

              <x-panel-fade />

              <x-panel-heading>
                <x-flags>
                  {project.featured && <x-flag data-tone="accent">{labels.featured}</x-flag>}
                  {project.industryLabel && <x-flag>{project.industryLabel}</x-flag>}
                </x-flags>
                <h2>{project.title}</h2>
              </x-panel-heading>
            </x-panel-cover>

            <x-panel-body>
              <dl>
                <x-fact>
                  <dt>{labels.client}</dt>
                  <dd>{project.clientName}</dd>
                </x-fact>
                {project.year && (
                  <x-fact>
                    <dt>{labels.year}</dt>
                    <dd>{project.year}</dd>
                  </x-fact>
                )}
              </dl>

              {project.summary && <p>{project.summary}</p>}

              {project.tech.length > 0 && (
                <x-panel-section>
                  <x-label>{labels.technologies}</x-label>
                  <x-tags>
                    {project.tech.map((tech) => (
                      <x-tag key={tech}>{tech}</x-tag>
                    ))}
                  </x-tags>
                </x-panel-section>
              )}

              {project.testimonial && (
                <blockquote>
                  <Quotes size={22} weight="fill" aria-hidden="true" />
                  <p>{project.testimonial}</p>
                  {project.testimonialAuthor && <footer>{project.testimonialAuthor}</footer>}
                </blockquote>
              )}
            </x-panel-body>

            <x-panel-actions>
              <button
                type="button"
                data-button="solid"
                onClick={() => onReadCaseStudy(project.slug)}
              >
                {labels.readCaseStudy}
                <ArrowDown size={15} weight="bold" />
              </button>

              {project.projectUrl && (
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-button="ghost"
                >
                  {labels.viewProject}
                  <ArrowUpRight size={15} weight="bold" />
                </a>
              )}
            </x-panel-actions>
          </Panel>
        </>
      )}
    </AnimatePresence>
  )
}
