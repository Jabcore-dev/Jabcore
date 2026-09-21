'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { MapNode, MapProject } from '@/lib/portfolio-map'

/**
 * Jedna bublina na mapě.
 *
 * Vždycky tmavé sklo s bílým textem, i ve světlém režimu: pod bublinou je
 * fotka z projektu, a jediný způsob, jak udržet čitelnost nad libovolným
 * snímkem v obou režimech, je nenechat kontrast na barvách tématu.
 *
 * Typografie se počítá z poloměru, ne z pevných tříd - bubliny se liší
 * velikostí a text v té malé by jinak přetekl.
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
  const size = node.r * 2

  return (
    <div
      className="absolute"
      style={{
        left: node.x,
        top: node.y,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="h-full w-full motion-safe:animate-[map-float_var(--float-duration)_ease-in-out_infinite]"
        style={
          {
            '--float-duration': `${node.floatDuration}s`,
            animationDelay: `${node.floatDelay}s`,
          } as React.CSSProperties
        }
      >
        <button
          ref={registerRef}
          type="button"
          onClick={onOpen}
          aria-label={label}
          data-slug={project.slug}
          className={cn(
            'group relative block h-full w-full cursor-pointer rounded-full text-center outline-none',
            'transition-[transform,opacity,filter] duration-500 ease-out',
            'focus-visible:ring-4 focus-visible:ring-accent/70',
            dimmed
              ? 'scale-[0.82] opacity-25 blur-[1px]'
              : 'hover:scale-[1.06] active:scale-[1.02]',
            active && 'scale-[1.08]',
          )}
        >
          {/* Svatozář - u zvýrazněných projektů svítí pořád, u ostatních až pod kurzorem. */}
          <span
            aria-hidden="true"
            className={cn(
              'absolute -inset-[8%] rounded-full opacity-0 blur-2xl transition-opacity duration-500',
              'bg-[radial-gradient(circle,var(--accent),transparent_70%)]',
              project.featured ? 'opacity-40' : 'group-hover:opacity-45',
              active && 'opacity-70',
            )}
          />

          <span
            className={cn(
              'absolute inset-0 overflow-hidden rounded-full',
              'shadow-[0_24px_60px_-18px_rgba(0,0,0,0.55)]',
              'ring-1 ring-white/20 transition-[box-shadow,--tw-ring-color] duration-500',
              'group-hover:ring-white/45',
              project.featured && 'ring-2 ring-accent/60',
              active && 'ring-2 ring-accent',
            )}
          >
            {project.coverImage ? (
              <>
                <Image
                  src={project.coverImage}
                  alt=""
                  fill
                  sizes="340px"
                  className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                />
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(10,12,18,0.35),rgba(8,10,16,0.88))] transition-opacity duration-500 group-hover:opacity-90" />
              </>
            ) : (
              <>
                <span className="absolute inset-0 bg-[linear-gradient(140deg,var(--primary),var(--accent))]" />
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(10,12,18,0.2),rgba(8,10,16,0.78))]" />
              </>
            )}

            {/* Lesk shora, aby bublina vypadala jako sklo, ne jako výřez fotky. */}
            <span className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.28),transparent_45%)] opacity-70" />
          </span>

          <span
            className="absolute inset-0 flex flex-col items-center justify-center px-[14%] text-white"
            style={{ gap: node.r * 0.05 }}
          >
            <span
              className="font-semibold uppercase text-white/65"
              style={{
                fontSize: node.r * 0.1,
                letterSpacing: node.r * 0.012,
                lineHeight: 1.3,
              }}
            >
              {project.clientName}
            </span>

            <span
              className={cn(
                'font-bold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]',
                // Do velké bubliny se vejde o řádek víc, než kolik unese malá.
                node.r >= 130 ? 'line-clamp-4' : 'line-clamp-3',
              )}
              style={{ fontFamily: 'var(--font-display)', fontSize: node.r * 0.165 }}
            >
              {project.title}
            </span>

            {(project.year || project.industryLabel) && (
              <span
                className="mt-[2%] inline-flex items-center rounded-full bg-white/15 font-medium text-white/80 backdrop-blur-sm"
                style={{
                  fontSize: node.r * 0.095,
                  paddingInline: node.r * 0.1,
                  paddingBlock: node.r * 0.035,
                }}
              >
                {[project.industryLabel, project.year].filter(Boolean).join(' · ')}
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}
