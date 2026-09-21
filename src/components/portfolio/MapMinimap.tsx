'use client'

import { useTransform, type MotionValue } from 'framer-motion'
import type { MapBounds, MapNode } from '@/lib/portfolio-map'
import { motionElement } from './motion-element'

const WIDTH = 188
const HEIGHT = 120
const PADDING = 10

const Frame = motionElement('x-overview-frame')

/**
 * Přehledka v rohu mapy.
 *
 * Bez ní se dá v přiblížené mapě ztratit - tohle ukazuje, kde ve scéně je
 * výřez, který je zrovna na obrazovce, a kliknutím se dá skočit jinam.
 * Obdélník výřezu jede přes motion values, takže při tažení mapy se
 * nepřekresluje React, jen se posune jeden element.
 */
export default function MapMinimap({
  nodes,
  bounds,
  x,
  y,
  scale,
  viewport,
  activeSlug,
  label,
  onJump,
}: {
  nodes: MapNode[]
  bounds: MapBounds
  x: MotionValue<number>
  y: MotionValue<number>
  scale: MotionValue<number>
  /** Rozměr plátna v pixelech; z něj se počítá velikost výřezu. */
  viewport: { width: number; height: number }
  activeSlug: string | null
  label: string
  /** Světové souřadnice, na které se má mapa vycentrovat. */
  onJump: (worldX: number, worldY: number) => void
}) {
  const ratio =
    Math.min(
      (WIDTH - PADDING * 2) / Math.max(bounds.width, 1),
      (HEIGHT - PADDING * 2) / Math.max(bounds.height, 1),
    ) || 1

  const toMiniX = (worldX: number) => (worldX - bounds.centerX) * ratio + WIDTH / 2
  const toMiniY = (worldY: number) => (worldY - bounds.centerY) * ratio + HEIGHT / 2

  /*
   * Výřez bývá větší než celá scéna - mapa se otevírá oddálená tak, aby se do
   * okna vešlo všechno i s rezervou. Nesmí proto přetéct z rámečku ven, jinak
   * z něj u hrany zbude jen nevysvětlitelná čára.
   */
  const frameLeft = useTransform([x, scale], ([tx, s]: number[]) =>
    Math.max(0, toMiniX(-tx / s)),
  )
  const frameTop = useTransform([y, scale], ([ty, s]: number[]) =>
    Math.max(0, toMiniY(-ty / s)),
  )
  const frameWidth = useTransform([x, scale], ([tx, s]: number[]) => {
    const left = toMiniX(-tx / s)
    return Math.max(0, Math.min(left + (viewport.width / s) * ratio, WIDTH) - Math.max(0, left))
  })
  const frameHeight = useTransform([y, scale], ([ty, s]: number[]) => {
    const top = toMiniY(-ty / s)
    return Math.max(0, Math.min(top + (viewport.height / s) * ratio, HEIGHT) - Math.max(0, top))
  })

  return (
    <x-overview role="group" aria-label={label} style={{ width: WIDTH, height: HEIGHT }}>
      <button
        type="button"
        aria-label={label}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const worldX = (event.clientX - rect.left - WIDTH / 2) / ratio + bounds.centerX
          const worldY = (event.clientY - rect.top - HEIGHT / 2) / ratio + bounds.centerY
          onJump(worldX, worldY)
        }}
      />

      {nodes.map((node) => (
        <x-overview-dot
          key={node.slug}
          aria-hidden="true"
          data-active={node.slug === activeSlug ? '' : undefined}
          style={{
            left: toMiniX(node.x),
            top: toMiniY(node.y),
            width: Math.max(4, node.r * ratio * 2),
            height: Math.max(4, node.r * ratio * 2),
          }}
        />
      ))}

      <Frame
        aria-hidden="true"
        style={{ left: frameLeft, top: frameTop, width: frameWidth, height: frameHeight }}
      />
    </x-overview>
  )
}
