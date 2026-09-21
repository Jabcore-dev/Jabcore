import Image from 'next/image'
import type { MapNode, MapProject } from '@/lib/portfolio-map'

/**
 * Jedna bublina na mapě.
 *
 * Vždycky tmavé sklo s bílým textem, i ve světlém režimu: pod bublinou je
 * fotka z projektu, a jediný způsob, jak udržet čitelnost nad libovolným
 * snímkem v obou režimech, je nenechat kontrast na barvách tématu.
 *
 * Typografie se počítá z poloměru, ne z pevné velikosti - bubliny se liší
 * velikostí a text v té malé by jinak přetekl. Proto tu jsou vlastní
 * vlastnosti `--r` a `--float-*`: čísla, která zná jen JavaScript, se předají
 * do CSS a zbytek si dopočítá stylopis.
 */
export default function ProjectBubble({
  project,
  node,
  dimmed,
  active,
  label,
  onOpen,
  registerRef,
}: {
  project: MapProject
  node: MapNode
  /** Nesedí do zapnutého filtru - zůstane na mapě, ale ustoupí do pozadí. */
  dimmed: boolean
  /** Otevřený v panelu. */
  active: boolean
  label: string
  onOpen: () => void
  registerRef: (element: HTMLButtonElement | null) => void
}) {
  return (
    <x-bubble
      style={
        {
          '--r': `${node.r}px`,
          '--float-duration': `${node.floatDuration}s`,
          '--float-delay': `${node.floatDelay}s`,
          left: node.x,
          top: node.y,
        } as React.CSSProperties
      }
    >
      <x-bubble-float>
        <button
          ref={registerRef}
          type="button"
          onClick={onOpen}
          aria-label={label}
          data-slug={project.slug}
          data-featured={project.featured ? '' : undefined}
          data-dimmed={dimmed ? '' : undefined}
          data-active={active ? '' : undefined}
        >
          {/* Svatozář - u zvýrazněných projektů svítí pořád, u ostatních až
              pod kurzorem. */}
          <x-bubble-halo aria-hidden="true" />

          <x-bubble-face>
            {project.coverImage ? (
              <Image src={project.coverImage} alt="" fill sizes="340px" />
            ) : (
              <x-bubble-blank />
            )}
            <x-bubble-shade />
            {/* Lesk shora, aby bublina vypadala jako sklo, ne jako výřez fotky. */}
            <x-bubble-gloss />
          </x-bubble-face>

          <x-bubble-label>
            <x-bubble-client>{project.clientName}</x-bubble-client>
            <x-bubble-title data-big={node.r >= 130 ? '' : undefined}>
              {project.title}
            </x-bubble-title>
            {(project.year || project.industryLabel) && (
              <x-bubble-meta>
                {[project.industryLabel, project.year].filter(Boolean).join(' · ')}
              </x-bubble-meta>
            )}
          </x-bubble-label>
        </button>
      </x-bubble-float>
    </x-bubble>
  )
}
