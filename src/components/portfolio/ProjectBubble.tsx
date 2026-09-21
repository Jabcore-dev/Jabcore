import Image from 'next/image'
import { Star } from '@phosphor-icons/react'
import type { MapNode, MapProject } from '@/lib/portfolio-map'

/**
 * Jedna bublina na mapě.
 *
 * Fotka z projektu nahoře, text dole na tmavém přechodu: bílý text musí držet
 * nad libovolným snímkem v obou režimech, a jediný způsob, jak to zaručit, je
 * nenechat kontrast na barvách tématu. Obrys a záře mají barvu oboru (--hue).
 *
 * Oblíbený projekt vypadá stejně jako ostatní - stejná velikost, stejné místo
 * v mapě. Liší se jen hvězdičkou nad jménem klienta.
 *
 * Typografie se počítá z poloměru (--r), ne z pevné velikosti - bubliny se
 * liší velikostí a text v té malé by jinak přetekl. Čísla, která zná jen
 * JavaScript, jdou do CSS jako vlastní vlastnosti a zbytek dopočítá stylopis.
 */
export default function ProjectBubble({
  project,
  node,
  dimmed,
  active,
  label,
  onKeyboardOpen,
}: {
  project: MapProject
  node: MapNode
  /** Nesedí do zapnutého filtru - zůstane na mapě, ale ustoupí do pozadí. */
  dimmed: boolean
  /** Otevřený v dialogu. */
  active: boolean
  label: string
  /**
   * Otevření z klávesnice (Enter, mezerník) nebo čtečky. Myš a prst obsluhuje
   * mapa sama při puštění, protože jen ona ví, jestli to byl klik, nebo tah.
   */
  onKeyboardOpen: () => void
}) {
  return (
    <x-bubble
      style={
        {
          '--r': `${node.r}px`,
          '--hue': project.hue,
          '--float-duration': `${node.floatDuration}s`,
          '--float-delay': `${node.floatDelay}s`,
          left: node.x,
          top: node.y,
        } as React.CSSProperties
      }
    >
      <x-bubble-float>
        <button
          type="button"
          onClick={(event) => {
            // detail === 0: klik nevyvolala myš ani prst, ale klávesa nebo
            // asistivní technologie. Klik myší už otevřela mapa na pointerup.
            if (event.detail === 0) onKeyboardOpen()
          }}
          aria-label={label}
          data-slug={project.slug}
          data-dimmed={dimmed ? '' : undefined}
          data-active={active ? '' : undefined}
        >
          <x-bubble-halo aria-hidden="true" />

          <x-bubble-face>
            {project.coverImage ? (
              <Image src={project.coverImage} alt="" fill sizes="360px" />
            ) : (
              <x-bubble-blank />
            )}
            <x-bubble-tint />
            <x-bubble-shade />
            {/* Odlesk a světlý okraj - aby bublina vypadala jako sklo, ne jako
                kulatý výřez fotky. */}
            <x-bubble-gloss />
          </x-bubble-face>

          <x-bubble-label>
            {project.featured && (
              <x-bubble-star aria-hidden="true">
                <Star weight="fill" />
              </x-bubble-star>
            )}
            <x-bubble-client>{project.clientName}</x-bubble-client>
            <x-bubble-title>{project.title}</x-bubble-title>
            {(project.year || project.industryLabel) && (
              <x-bubble-meta>
                {project.industryLabel && <x-swatch aria-hidden="true" />}
                {/* Rok první: když se dlouhý obor nevejde, zkrátí se obor (je ve
                    filtru i v detailu), rok zůstane celý. */}
                <span>{[project.year, project.industryLabel].filter(Boolean).join(' · ')}</span>
              </x-bubble-meta>
            )}
          </x-bubble-label>
        </button>
      </x-bubble-float>
    </x-bubble>
  )
}
