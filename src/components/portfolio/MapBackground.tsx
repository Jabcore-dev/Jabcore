'use client'

import { useTransform, type MotionValue } from 'framer-motion'
import { motionElement } from './motion-element'

/**
 * Pozadí mapy - stejná nálada jako hero na jabcore.cz (rozmazané kruhy značky,
 * poletující tečky), ale reaguje na posun mapy: mřížka a kruhy jedou pomaleji
 * než bubliny, takže vznikne hloubka a je vidět, že se opravdu někam jede.
 *
 * Tečky mají pevné pozice, ne Math.random() jako hero: tahle stránka se
 * renderuje i na serveru a náhodné souřadnice by se při hydrataci neshodly.
 */

const Grid = motionElement('x-map-grid')
const Orbs = motionElement('x-map-orbs')

const DOTS = Array.from({ length: 34 }, (_, i) => ({
  // Zlatý řez rozhází body po ploše rovnoměrně a přitom nepravidelně.
  left: (i * 34.618) % 100,
  top: (i * 61.803) % 100,
  duration: 6 + ((i * 7) % 5),
  delay: -((i * 13) % 9),
  size: i % 5 === 0 ? 3 : 2,
}))

export default function MapBackground({
  x,
  y,
  scale,
}: {
  x: MotionValue<number>
  y: MotionValue<number>
  scale: MotionValue<number>
}) {
  // Mřížka se posouvá zlomkem toho, co bubliny - klasický parallax.
  const gridPosition = useTransform([x, y], ([tx, ty]: number[]) => `${tx * 0.35}px ${ty * 0.35}px`)
  const gridSize = useTransform(scale, (value) => `${64 * value}px ${64 * value}px`)
  const orbX = useTransform(x, (value) => value * 0.12)
  const orbY = useTransform(y, (value) => value * 0.12)

  return (
    <x-map-sky aria-hidden="true">
      <x-map-wash />

      <Grid style={{ backgroundSize: gridSize, backgroundPosition: gridPosition }} />

      <Orbs style={{ x: orbX, y: orbY }}>
        <x-map-orb data-orb="primary" />
        <x-map-orb data-orb="accent" />
        <x-map-orb data-orb="core" />
      </Orbs>

      <x-map-stars>
        {DOTS.map((dot, index) => (
          <x-map-star
            key={index}
            style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              width: dot.size,
              height: dot.size,
              animationDelay: `${dot.delay}s`,
              animationDuration: `${dot.duration}s`,
            }}
          />
        ))}
      </x-map-stars>

      {/* Změkčuje hranu mapy proti hlavičce a proti sekci pod ní, aby bubliny
          u kraje nekončily useknuté. */}
      <x-map-haze data-edge="top" />
      <x-map-haze data-edge="bottom" />
    </x-map-sky>
  )
}
