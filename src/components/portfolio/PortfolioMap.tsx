'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, useMotionTemplate, useMotionValue } from 'framer-motion'
import {
  ArrowsOut,
  ArrowsIn,
  Plus,
  Minus,
  CornersOut,
  HandGrabbing,
} from '@phosphor-icons/react'
import { buildMapLayout, type MapProject } from '@/lib/portfolio-map'
import { motionElement } from './motion-element'
import ProjectBubble from './ProjectBubble'
import ProjectPanel, { type PanelLabels } from './ProjectPanel'
import MapBackground from './MapBackground'
import MapMinimap from './MapMinimap'

export interface MapLabels extends PanelLabels {
  /** Nadpis stránky. Vykresluje ho mapa, viz poznámka u horní vrstvy. */
  title: string
  subtitle: string
  all: string
  hint: string
  zoomIn: string
  zoomOut: string
  reset: string
  expand: string
  collapse: string
  minimap: string
  region: string
  open: string
  empty: string
}

const SPRING = { type: 'spring', stiffness: 170, damping: 26, mass: 0.9 } as const

const Scene = motionElement('x-map-scene')
const MIN_SCALE = 0.22
const MAX_SCALE = 2.4

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Portfolio jako mapa, po které se dá jezdit.
 *
 * Proč mapa a ne mřížka karet: onepager používá hlavně obchodník při schůzce.
 * Mřížka je seznam, kterým se roluje; mapa je scéna, kterou může ukazovat -
 * odjet k celku, najet na jeden projekt, otevřít ho. Velikost bubliny nese
 * význam (zvýrazněné projekty jsou největší) a čáry mezi nimi ukazují, co
 * spadá do stejného oboru.
 *
 * Posun a zoom jedou přes motion values, ne přes stav Reactu: při tažení se tak
 * nepřekresluje žádná komponenta, mění se jediná transformace na jednom uzlu.
 *
 * Kolečko myši se schválně nezabírá - mapa je vysoká přes celé okno a pod ní
 * je ještě text, takže přepsat rolování stránky by návštěvníka uvěznilo.
 * Přibližuje se tlačítky, gestem (ctrl/shift + kolečko), dvojklikem nebo
 * roztažením prstů. Na dotykových displejích drží mapa svislé rolování
 * stránky, dokud se nepřepne do režimu přes celou obrazovku.
 */
export default function PortfolioMap({
  projects,
  industries,
  labels,
}: {
  projects: MapProject[]
  industries: { key: string; label: string }[]
  labels: MapLabels
}) {
  const layout = useMemo(() => buildMapLayout(projects), [projects])

  const [industry, setIndustry] = useState<string | null>(null)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [immersive, setImmersive] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)
  const [ready, setReady] = useState(false)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  const surfaceRef = useRef<HTMLElement>(null)
  const bubbleRefs = useRef(new Map<string, HTMLButtonElement>())
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
  } | null>(null)
  const movedRef = useRef(false)
  const pinchRef = useRef<number | null>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const transform = useMotionTemplate`translate(${x}px, ${y}px) scale(${scale})`

  const activeProject = useMemo(
    () => projects.find((project) => project.slug === activeSlug) ?? null,
    [projects, activeSlug],
  )

  /** Slugy, které projdou filtrem. null = filtr je vypnutý. */
  const allowed = useMemo(() => {
    if (!industry) return null
    return new Set(
      projects.filter((project) => project.industry === industry).map((project) => project.slug),
    )
  }, [projects, industry])

  /** Celá mapa do okna, s rezervou po krajích. */
  const fit = useCallback(
    (animated: boolean) => {
      const element = surfaceRef.current
      if (!element || layout.nodes.length === 0) return

      const { width, height } = element.getBoundingClientRect()
      if (width === 0 || height === 0) return

      const padding = width < 640 ? 24 : 72
      // Nahoře sedí titulek s filtrem, dole nápověda a ovládání. Scéna se
      // skládá do pruhu mezi nimi, ne do celého okna.
      const insetTop = immersive ? 88 : width < 640 ? 222 : width < 1024 ? 246 : 262
      const insetBottom = 104
      const usableHeight = Math.max(height - insetTop - insetBottom, 160)

      const target = clamp(
        Math.min(
          (width - padding * 2) / Math.max(layout.bounds.width, 1),
          usableHeight / Math.max(layout.bounds.height, 1),
        ),
        MIN_SCALE,
        1.15,
      )

      /*
       * Na telefonu se celá scéna do okna vejde jen za cenu bublin, ve kterých
       * nejde přečíst název - a mapa, která se celá vejde na obrazovku, ani
       * není mapa. Pod hranicí čitelnosti se proto scéna nezmenšuje dál;
       * místo toho začne u prvního projektu (ten, který má admin nahoře)
       * a zbytek si návštěvník najede.
       */
      const readable = width < 640 ? Math.max(target, 0.6) : target
      const anchor =
        readable > target && layout.nodes.length > 0
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
    [layout, immersive, scale, x, y],
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

  const zoomByButton = useCallback(
    (factor: number) => {
      const element = surfaceRef.current
      if (!element) return
      const { width, height } = element.getBoundingClientRect()
      zoomAt(factor, width / 2, height / 2, true)
    },
    [zoomAt],
  )

  /**
   * Přijede k jednomu projektu.
   *
   * Necentruje se doprostřed okna, ale doprostřed toho, co z okna zbude vedle
   * panelu - jinak by otevřená bublina skončila přesně pod ním.
   */
  const focusSlug = useCallback(
    (slug: string) => {
      const element = surfaceRef.current
      const node = layout.nodes.find((item) => item.slug === slug)
      if (!element || !node) return

      const { width, height } = element.getBoundingClientRect()
      const wide = width >= 640
      const panelWidth = wide ? (width >= 1024 ? 464 : 416) + 44 : 0
      const freeWidth = width - panelWidth
      const freeHeight = wide ? height : height * 0.3

      // Bublina má zabrat zhruba polovinu volné plochy: dost na to, aby byla
      // zřetelně vybraná, a pořád tak, aby kolem ní zůstaly vidět sousedi
      // a bylo poznat, kde na mapě zrovna jsme.
      const target = clamp(
        (Math.min(freeWidth, freeHeight) * 0.52) / (node.r * 2),
        0.4,
        wide ? 1.15 : 0.85,
      )

      animate(scale, target, SPRING)
      animate(x, freeWidth / 2 - node.x * target, SPRING)
      animate(y, (wide ? height / 2 : height * 0.15) - node.y * target, SPRING)
    },
    [layout, scale, x, y],
  )

  const open = useCallback(
    (slug: string) => {
      setActiveSlug(slug)
      setHintVisible(false)
      focusSlug(slug)
      // Adresa s projektem je sdílitelná - obchodník může poslat odkaz rovnou
      // na konkrétní bublinu. replaceState, aby se historie nezaplnila.
      window.history.replaceState(null, '', `#${slug}`)
    },
    [focusSlug],
  )

  const close = useCallback(() => {
    const slug = activeSlug
    setActiveSlug(null)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    // Klávesnice se musí vrátit na bublinu, ze které se panel otevřel.
    if (slug) bubbleRefs.current.get(slug)?.focus({ preventScroll: true })
  }, [activeSlug])

  /** Odkaz s #slug otevře rovnou daný projekt. */
  useEffect(() => {
    const slug = window.location.hash.slice(1)
    if (!slug || !projects.some((project) => project.slug === slug)) return

    const timer = window.setTimeout(() => {
      surfaceRef.current?.scrollIntoView({ block: 'start' })
      open(slug)
    }, 160)

    return () => window.clearTimeout(timer)
    // Jen při prvním vykreslení - později hash mění už jen tahle komponenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Kolečko: zoom jen s modifikátorem nebo v režimu přes celou obrazovku. */
  useEffect(() => {
    const element = surfaceRef.current
    if (!element) return

    const onWheel = (event: WheelEvent) => {
      const zoomGesture = event.ctrlKey || event.metaKey || event.shiftKey
      if (!zoomGesture && !immersive) return

      event.preventDefault()
      const rect = element.getBoundingClientRect()
      zoomAt(
        Math.exp(-event.deltaY * 0.0022),
        event.clientX - rect.left,
        event.clientY - rect.top,
      )
      setHintVisible(false)
    }

    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [immersive, zoomAt])

  useEffect(() => {
    if (!immersive) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !activeSlug) setImmersive(false)
    }

    // Stránka pod mapou se v tomhle režimu nesmí rolovat: mapa kreslí přes
    // celé okno a posunuté pozadí by se objevilo ve chvíli, kdy se z něj
    // vrátíme zpátky.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [immersive, activeSlug])

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture(event.pointerId)
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
    }
  }

  const pinchDistance = (): number => {
    const [first, second] = [...pointersRef.current.values()]
    if (!first || !second) return 0
    return Math.hypot(second.x - first.x, second.y - first.y)
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

    if (!movedRef.current && Math.abs(deltaX) + Math.abs(deltaY) > 6) {
      movedRef.current = true
      setHintVisible(false)
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

  const scrollToCaseStudy = (slug: string) => {
    close()
    setImmersive(false)
    /*
     * Až po překreslení. Odchod z režimu přes celou obrazovku vrací mapu do
     * toku stránky a tím mění pozice všeho pod ní - rolovat dřív by znamenalo
     * mířit na souřadnici, která za okamžik nebude platit.
     */
    window.setTimeout(() => {
      document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 180)
  }

  if (projects.length === 0) {
    return <x-map-empty>{labels.empty}</x-map-empty>
  }

  return (
    <section
      aria-label={labels.region}
      data-block="project-map"
      data-immersive={immersive ? '' : undefined}
    >
      <x-map-canvas
        ref={surfaceRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={(event) => {
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
              label={`${labels.open}: ${project.title}`}
              registerRef={(element) => {
                if (element) bubbleRefs.current.set(project.slug, element)
                else bubbleRefs.current.delete(project.slug)
              }}
              onOpen={() => {
                // Klik, který vznikl koncem tažení, není volba projektu.
                if (movedRef.current) return
                open(project.slug)
              }}
            />
          ))}
        </Scene>
      </x-map-canvas>

      <x-map-top>
        {/* V režimu přes celou obrazovku jde o místo, ne o kontext. */}
        {!immersive && (
          <x-map-title>
            <h1>
              <x-gradient>{labels.title}</x-gradient>
            </h1>
            <p>{labels.subtitle}</p>
          </x-map-title>
        )}

        {industries.length > 1 && (
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
              >
                {item.label}
              </button>
            ))}
          </x-map-filters>
        )}
      </x-map-top>

      <x-map-tools>
        <button type="button" aria-label={labels.zoomIn} title={labels.zoomIn} onClick={() => zoomByButton(1.35)}>
          <Plus size={16} weight="bold" />
        </button>
        <button type="button" aria-label={labels.zoomOut} title={labels.zoomOut} onClick={() => zoomByButton(1 / 1.35)}>
          <Minus size={16} weight="bold" />
        </button>
        <button type="button" aria-label={labels.reset} title={labels.reset} onClick={() => fit(true)}>
          <CornersOut size={16} weight="bold" />
        </button>
        <button
          type="button"
          aria-label={immersive ? labels.collapse : labels.expand}
          title={immersive ? labels.collapse : labels.expand}
          onClick={() => setImmersive((value) => !value)}
        >
          {immersive ? <ArrowsIn size={16} weight="bold" /> : <ArrowsOut size={16} weight="bold" />}
        </button>
      </x-map-tools>

      <x-map-corner>
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

      <x-map-hint data-hidden={hintVisible ? undefined : ''}>
        <HandGrabbing size={14} weight="fill" />
        {labels.hint}
      </x-map-hint>

      <ProjectPanel
        project={activeProject}
        labels={labels}
        onClose={close}
        onReadCaseStudy={scrollToCaseStudy}
      />
    </section>
  )
}
