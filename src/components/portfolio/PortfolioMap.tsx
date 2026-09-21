'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, useMotionTemplate, useMotionValue, useMotionValueEvent } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  ArrowsIn,
  ArrowsOut,
  CornersOut,
  HandGrabbing,
  Minus,
  Plus,
  X,
} from '@phosphor-icons/react'
import { buildMapLayout, type MapProject } from '@/lib/portfolio-map'
import { motionElement } from './motion-element'
import ProjectBubble from './ProjectBubble'
import MapBackground from './MapBackground'
import MapMinimap from './MapMinimap'

export interface MapLabels {
  all: string
  hint: string
  zoomIn: string
  zoomOut: string
  reset: string
  fullscreen: string
  exitFullscreen: string
  minimap: string
  region: string
  open: string
  empty: string
  close: string
  previous: string
  next: string
  /** Pro čtečky: hvězdička v bublině je jen obrázek. */
  featured: string
}

const SPRING = { type: 'spring', stiffness: 170, damping: 26, mass: 0.9 } as const
const MIN_SCALE = 0.22
const MAX_SCALE = 2.6

const Scene = motionElement('x-map-scene')

/** Slug bubliny pod ukazatelem, nebo null. */
function slugAt(target: EventTarget | null): string | null {
  return target instanceof Element
    ? (target.closest<HTMLElement>('[data-slug]')?.dataset.slug ?? null)
    : null
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Portfolio jako mapa, po které se dá jezdit - a nic jiného na stránce není.
 *
 * Proč mapa a ne mřížka karet: onepager používá hlavně obchodník při schůzce.
 * Mřížka je seznam, kterým se roluje; mapa je scéna, kterou může ukazovat -
 * odjet k celku, najet na jeden projekt, otevřít ho. Velikost bubliny nese
 * význam (zvýrazněné projekty jsou největší), barva obor a čáry mezi nimi
 * ukazují, co k sobě patří.
 *
 * Stránka se neroluje, takže kolečko myši patří mapě a přibližuje. Detail
 * projektu je nativní <dialog>: fokus, Escape, ztmavené pozadí a zablokování
 * mapy za ním dává prohlížeč sám a uvnitř se roluje.
 *
 * Case studies přicházejí hotové ze serveru (`details`) a leží v dialogu
 * pořád, jen skryté. Díky tomu jsou celé v HTML pro vyhledávač, i když je
 * návštěvník uvidí až po kliknutí - stejně jako obsah záložek nebo akordeonu.
 *
 * Posun a zoom jedou přes motion values, ne přes stav Reactu: při tažení se
 * nepřekresluje žádná komponenta, mění se jediná transformace na jednom uzlu.
 */
export default function PortfolioMap({
  projects,
  industries,
  details,
  labels,
}: {
  projects: MapProject[]
  industries: { key: string; label: string; hue: number }[]
  /** Case study každého projektu, vykreslená na serveru, podle slugu. */
  details: Record<string, React.ReactNode>
  labels: MapLabels
}) {
  const layout = useMemo(() => buildMapLayout(projects), [projects])

  const [industry, setIndustry] = useState<string | null>(null)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [hintVisible, setHintVisible] = useState(true)
  const [ready, setReady] = useState(false)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [canFullscreen, setCanFullscreen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [overviewNeeded, setOverviewNeeded] = useState(false)

  const surfaceRef = useRef<HTMLElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const dossierRef = useRef<HTMLElement>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const dragRef = useRef<{
    id: number
    startX: number
    startY: number
    baseX: number
    baseY: number
    lastX: number
    lastY: number
    lastTime: number
    vx: number
    vy: number
    /** Bublina, na které tah začal - otevře se, pokud se ukazatel nepohne. */
    slug: string | null
    /** Od kolika pixelů je to tah, ne klik. Prst se chvěje víc než myš. */
    threshold: number
    captured: boolean
  } | null>(null)
  const movedRef = useRef(false)
  const pinchRef = useRef<number | null>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const transform = useMotionTemplate`translate(${x}px, ${y}px) scale(${scale})`

  /*
   * Přehledka má smysl, jen když část mapy leží mimo okno. Když je vidět celá,
   * jen by zakrývala bubliny v rohu. setState se volá při každém snímku, ale
   * React překreslí jen ve chvíli, kdy se hodnota opravdu přepne.
   */
  const updateOverview = () => {
    // Rozměr přímo z elementu, ne ze stavu `viewport`: ten se při prvním
    // přizpůsobení mapy nastavuje ve stejném kroku a tady by byl ještě nulový.
    const element = surfaceRef.current
    if (!element) return
    const viewport = { width: element.clientWidth, height: element.clientHeight }
    const s = scale.get()
    const { minX, minY, maxX, maxY } = layout.bounds
    const margin = 8
    const outside =
      minX * s + x.get() < -margin ||
      minY * s + y.get() < -margin ||
      maxX * s + x.get() > viewport.width + margin ||
      maxY * s + y.get() > viewport.height + margin
    setOverviewNeeded(outside)
  }
  useMotionValueEvent(x, 'change', updateOverview)
  useMotionValueEvent(y, 'change', updateOverview)
  useMotionValueEvent(scale, 'change', updateOverview)

  /** Slugy, které projdou filtrem. null = filtr je vypnutý. */
  const allowed = useMemo(() => {
    if (!industry) return null
    return new Set(
      projects.filter((project) => project.industry === industry).map((project) => project.slug),
    )
  }, [projects, industry])

  const activeIndex = projects.findIndex((project) => project.slug === activeSlug)
  const previousProject =
    activeIndex === -1 ? null : projects[(activeIndex - 1 + projects.length) % projects.length]
  const nextProject = activeIndex === -1 ? null : projects[(activeIndex + 1) % projects.length]

  /** Celá mapa do okna, s rezervou pro spodní lištu. */
  const fit = useCallback(
    (animated: boolean) => {
      const element = surfaceRef.current
      if (!element || layout.nodes.length === 0) return

      const { width, height } = element.getBoundingClientRect()
      if (width === 0 || height === 0) return

      const padding = width < 640 ? 20 : 64
      // Nahoře jen vzduch, dole lišta s filtrem a ovládáním.
      const insetTop = 56
      const insetBottom = width < 640 ? 88 : 96
      const usableHeight = Math.max(height - insetTop - insetBottom, 160)

      const target = clamp(
        Math.min(
          (width - padding * 2) / Math.max(layout.bounds.width, 1),
          usableHeight / Math.max(layout.bounds.height, 1),
        ),
        MIN_SCALE,
        1.2,
      )

      /*
       * Na telefonu se celá scéna do okna vejde jen za cenu bublin, ve kterých
       * nejde přečíst název. Pod hranicí čitelnosti se proto scéna nezmenšuje
       * dál; začne u prvního projektu (ten, který má admin nahoře) a zbytek si
       * návštěvník najede.
       */
      const readable = width < 640 ? Math.max(target, 0.6) : target
      const anchor =
        readable > target
          ? layout.nodes[0]
          : { x: layout.bounds.centerX, y: layout.bounds.centerY }

      const nextX = width / 2 - anchor.x * readable
      const nextY = insetTop + usableHeight / 2 - anchor.y * readable

      if (animated) {
        animate(scale, readable, SPRING)
        animate(x, nextX, SPRING)
        animate(y, nextY, SPRING)
      } else {
        scale.set(readable)
        x.set(nextX)
        y.set(nextY)
      }
    },
    [layout, scale, x, y],
  )

  useEffect(() => {
    const element = surfaceRef.current
    if (!element) return

    const observer = new ResizeObserver(() => {
      const rect = element.getBoundingClientRect()
      setViewport({ width: rect.width, height: rect.height })
      fit(false)
      setReady(true)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [fit])

  const zoomAt = useCallback(
    (factor: number, centerX: number, centerY: number, animated = false) => {
      const current = scale.get()
      const next = clamp(current * factor, MIN_SCALE, MAX_SCALE)
      if (next === current) return

      const ratio = next / current
      const nextX = centerX - (centerX - x.get()) * ratio
      const nextY = centerY - (centerY - y.get()) * ratio

      if (animated) {
        animate(scale, next, SPRING)
        animate(x, nextX, SPRING)
        animate(y, nextY, SPRING)
      } else {
        scale.set(next)
        x.set(nextX)
        y.set(nextY)
      }
    },
    [scale, x, y],
  )

  const zoomByButton = (factor: number) => {
    const element = surfaceRef.current
    if (!element) return
    const { width, height } = element.getBoundingClientRect()
    zoomAt(factor, width / 2, height / 2, true)
  }

  /**
   * Přijede k projektu. Za otevřeným dialogem to vidět není, ale po jeho
   * zavření návštěvník skončí u bubliny, kterou právě viděl - ne tam, odkud
   * na ni klikl před třemi projekty.
   */
  const focusSlug = useCallback(
    (slug: string) => {
      const element = surfaceRef.current
      const node = layout.nodes.find((item) => item.slug === slug)
      if (!element || !node) return

      const { width, height } = element.getBoundingClientRect()
      const target = clamp((Math.min(width, height) * 0.5) / (node.r * 2), 0.45, 1.2)

      animate(scale, target, SPRING)
      animate(x, width / 2 - node.x * target, SPRING)
      animate(y, height / 2 - node.y * target, SPRING)
    },
    [layout, scale, x, y],
  )

  const open = useCallback(
    (slug: string) => {
      setActiveSlug(slug)
      setHintVisible(false)
      focusSlug(slug)
      // Adresa s projektem je sdílitelná - obchodník může poslat odkaz rovnou
      // na konkrétní projekt. replaceState, aby se historie nezaplnila.
      window.history.replaceState(null, '', `#${slug}`)
    },
    [focusSlug],
  )

  const close = useCallback(() => {
    setActiveSlug(null)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])

  /** Otevřený projekt ↔ otevřený dialog. */
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (activeSlug) {
      if (!dialog.open) dialog.showModal()
      // Další projekt začíná nahoře, ne v půlce textu toho předchozího.
      dossierRef.current?.scrollTo({ top: 0 })
    } else if (dialog.open) {
      dialog.close()
    }
  }, [activeSlug])

  /** Odkaz s #slug otevře rovnou daný projekt. */
  useEffect(() => {
    const slug = window.location.hash.slice(1)
    if (!slug || !projects.some((project) => project.slug === slug)) return

    const timer = window.setTimeout(() => open(slug), 200)
    return () => window.clearTimeout(timer)
    // Jen při prvním vykreslení - později hash mění už jen tahle komponenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Kolečko přibližuje, vodorovný posun na touchpadu posouvá. */
  useEffect(() => {
    const element = surfaceRef.current
    if (!element) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setHintVisible(false)

      // Firefox umí hlásit posun v řádcích místo v pixelech.
      const unit = event.deltaMode === 1 ? 16 : 1
      const deltaX = event.deltaX * unit
      const deltaY = event.deltaY * unit

      if (!event.ctrlKey && Math.abs(deltaX) > Math.abs(deltaY)) {
        x.set(x.get() - deltaX)
        return
      }

      const rect = element.getBoundingClientRect()
      // ctrlKey = sevření prstů na touchpadu; chodí po malých krocích, proto citlivěji.
      const speed = event.ctrlKey ? 0.01 : 0.0022
      zoomAt(Math.exp(-deltaY * speed), event.clientX - rect.left, event.clientY - rect.top)
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [zoomAt, x])

  /** Celá obrazovka jen tam, kde ji prohlížeč umí (iPhone ne). */
  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled))
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen()
  }

  const pinchDistance = (): number => {
    const [first, second] = [...pointersRef.current.values()]
    if (!first || !second) return 0
    return Math.hypot(second.x - first.x, second.y - first.y)
  }

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    movedRef.current = false

    if (pointersRef.current.size === 2) {
      dragRef.current = null
      pinchRef.current = pinchDistance()
      return
    }

    dragRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: x.get(),
      baseY: y.get(),
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      vx: 0,
      vy: 0,
      slug: slugAt(event.target),
      threshold: event.pointerType === 'mouse' ? 5 : 10,
      captured: false,
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 2) {
      const previous = pinchRef.current
      const current = pinchDistance()
      pinchRef.current = current

      if (previous && current) {
        const [first, second] = [...pointersRef.current.values()]
        const rect = event.currentTarget.getBoundingClientRect()
        zoomAt(
          current / previous,
          (first.x + second.x) / 2 - rect.left,
          (first.y + second.y) / 2 - rect.top,
        )
        movedRef.current = true
        setHintVisible(false)
      }
      return
    }

    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY

    // Do překročení prahu se mapa nehýbe: jinak by se každý klik, při kterém
    // se ruka o pixel pohne, proměnil v cuknutí mapy.
    if (!movedRef.current) {
      if (Math.hypot(deltaX, deltaY) < drag.threshold) return
      movedRef.current = true
      setHintVisible(false)
    }

    /*
     * Ukazatel si canvas přivlastní až teď, když je jasné, že jde o tah - tah
     * pak pokračuje, i když kurzor vyjede z mapy. Přivlastnit si ho hned při
     * stisku byla původní chyba: prohlížeč pak poslal i `click` canvasu místo
     * bubliny a detail se nikdy neotevřel.
     */
    if (!drag.captured) {
      drag.captured = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    const elapsed = Math.max(event.timeStamp - drag.lastTime, 1)
    drag.vx = ((event.clientX - drag.lastX) / elapsed) * 1000
    drag.vy = ((event.clientY - drag.lastY) / elapsed) * 1000
    drag.lastX = event.clientX
    drag.lastY = event.clientY
    drag.lastTime = event.timeStamp

    x.set(drag.baseX + deltaX)
    y.set(drag.baseY + deltaY)
  }

  const endPointer = (event: React.PointerEvent<HTMLElement>) => {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null

    const drag = dragRef.current
    if (!drag || drag.id !== event.pointerId) return
    dragRef.current = null

    /*
     * Klik = stisk i puštění na stejné bublině a mezitím žádný tah. Rozhoduje
     * se tady, ne v onClick: na dotyku a po přivlastnění ukazatele se na
     * `click` nedá spolehnout, na pointerup ano.
     */
    if (
      event.type === 'pointerup' &&
      !movedRef.current &&
      drag.slug &&
      slugAt(event.target) === drag.slug
    ) {
      open(drag.slug)
      return
    }

    // Dojezd. Mapa, která se zastaví přesně pod prstem, působí zaseknutě.
    if (movedRef.current && Math.hypot(drag.vx, drag.vy) > 120) {
      animate(x, x.get(), { type: 'inertia', velocity: drag.vx, power: 0.28, timeConstant: 320 })
      animate(y, y.get(), { type: 'inertia', velocity: drag.vy, power: 0.28, timeConstant: 320 })
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const step = 90
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }

    if (moves[event.key]) {
      event.preventDefault()
      const [dx, dy] = moves[event.key]
      animate(x, x.get() + dx, SPRING)
      animate(y, y.get() + dy, SPRING)
      setHintVisible(false)
      return
    }

    if (event.key === '+' || event.key === '=') zoomByButton(1.35)
    if (event.key === '-') zoomByButton(1 / 1.35)
    if (event.key === '0') fit(true)
  }

  if (projects.length === 0) {
    return <x-map-empty>{labels.empty}</x-map-empty>
  }

  return (
    <section aria-label={labels.region} data-block="project-map">
      <x-map-canvas
        ref={surfaceRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={(event) => {
          // Dvojklik na bublinu ji otevře, nepřibližuje.
          if (slugAt(event.target)) return
          const rect = event.currentTarget.getBoundingClientRect()
          zoomAt(1.6, event.clientX - rect.left, event.clientY - rect.top, true)
        }}
      >
        <MapBackground x={x} y={y} scale={scale} />

        {/* Počátek transformace v rohu, ne uprostřed: na tom stojí veškerá
            matematika posunu a zoomu výš (svět → obrazovka = p · s + t). */}
        <Scene style={{ transform, transformOrigin: '0 0', opacity: ready ? 1 : 0 }}>
          <svg width="1" height="1" aria-hidden="true">
            {layout.links.map((link) => {
              const a = layout.nodes[link.a]
              const b = layout.nodes[link.b]
              const muted = allowed !== null && (!allowed.has(a.slug) || !allowed.has(b.slug))

              return (
                <line
                  key={`${link.a}-${link.b}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  data-strong={link.strong ? '' : undefined}
                  data-muted={muted ? '' : undefined}
                  style={{ '--hue': projects[link.a].hue } as React.CSSProperties}
                  // Bez tohohle tloušťka klesá se zoomem a při oddálení
                  // souhvězdí zmizí úplně.
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </svg>

          {projects.map((project, index) => (
            <ProjectBubble
              key={project.slug}
              project={project}
              node={layout.nodes[index]}
              dimmed={allowed !== null && !allowed.has(project.slug)}
              active={activeSlug === project.slug}
              label={`${labels.open}: ${project.title}${project.featured ? ` (${labels.featured})` : ''}`}
              onKeyboardOpen={() => open(project.slug)}
            />
          ))}
        </Scene>
      </x-map-canvas>

      <x-map-hint data-hidden={hintVisible ? undefined : ''}>
        <HandGrabbing size={14} weight="fill" />
        {labels.hint}
      </x-map-hint>

      <x-map-corner data-hidden={overviewNeeded ? undefined : ''}>
        <MapMinimap
          nodes={layout.nodes}
          bounds={layout.bounds}
          x={x}
          y={y}
          scale={scale}
          viewport={viewport}
          activeSlug={activeSlug}
          label={labels.minimap}
          onJump={(worldX, worldY) => {
            const current = scale.get()
            animate(x, viewport.width / 2 - worldX * current, SPRING)
            animate(y, viewport.height / 2 - worldY * current, SPRING)
          }}
        />
      </x-map-corner>

      <x-map-dock>
        {industries.length > 1 ? (
          <x-map-filters role="group" aria-label={labels.all}>
            <button
              type="button"
              aria-pressed={industry === null}
              onClick={() => setIndustry(null)}
            >
              {labels.all}
            </button>
            {industries.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={industry === item.key}
                onClick={() => setIndustry(industry === item.key ? null : item.key)}
                style={{ '--hue': item.hue } as React.CSSProperties}
              >
                <x-swatch aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </x-map-filters>
        ) : (
          <x-map-spacer />
        )}

        <x-map-tools>
          <button type="button" aria-label={labels.zoomOut} title={labels.zoomOut} onClick={() => zoomByButton(1 / 1.35)}>
            <Minus size={16} weight="bold" />
          </button>
          <button type="button" aria-label={labels.zoomIn} title={labels.zoomIn} onClick={() => zoomByButton(1.35)}>
            <Plus size={16} weight="bold" />
          </button>
          <button type="button" aria-label={labels.reset} title={labels.reset} onClick={() => fit(true)}>
            <CornersOut size={16} weight="bold" />
          </button>
          {canFullscreen && (
            <button
              type="button"
              aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
              title={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <ArrowsIn size={16} weight="bold" /> : <ArrowsOut size={16} weight="bold" />}
            </button>
          )}
        </x-map-tools>
      </x-map-dock>

      <dialog
        ref={dialogRef}
        aria-label={projects[activeIndex]?.title}
        onClose={close}
        onClick={(event) => {
          // Klik na ztmavené pozadí; obsah dialogu vyplňuje celý jeho rámeček.
          if (event.target === event.currentTarget) close()
        }}
        onKeyDown={(event) => {
          if (!previousProject || !nextProject) return
          if (event.key === 'ArrowLeft') open(previousProject.slug)
          if (event.key === 'ArrowRight') open(nextProject.slug)
        }}
      >
        <button type="button" data-button="close" aria-label={labels.close} onClick={close}>
          <X size={18} weight="bold" />
        </button>

        <x-dossier ref={dossierRef}>
          {projects.map((project) => (
            <x-dossier-entry key={project.slug} hidden={project.slug !== activeSlug}>
              {details[project.slug]}
            </x-dossier-entry>
          ))}
        </x-dossier>

        {projects.length > 1 && previousProject && nextProject && (
          <x-dossier-nav>
            <button type="button" onClick={() => open(previousProject.slug)}>
              <ArrowLeft size={16} weight="bold" />
              <span>
                <x-label>{labels.previous}</x-label>
                {previousProject.title}
              </span>
            </button>
            <button type="button" onClick={() => open(nextProject.slug)}>
              <span>
                <x-label>{labels.next}</x-label>
                {nextProject.title}
              </span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </x-dossier-nav>
        )}
      </dialog>
    </section>
  )
}
