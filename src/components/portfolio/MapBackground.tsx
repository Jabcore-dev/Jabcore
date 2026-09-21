'use client'

import { motion, useTransform, type MotionValue } from 'framer-motion'

/**
 * Pozadí mapy - stejná nálada jako hero na jabcore.cz (rozmazané kruhy značky,
 * poletující tečky), ale reaguje na posun mapy: mřížka a kruhy jedou pomaleji
 * než bubliny, takže vznikne hloubka a je vidět, že se opravdu někam jede.
 *
 * Tečky mají pevné pozice, ne Math.random() jako hero: tahle stránka se
 * renderuje i na serveru a náhodné souřadnice by se při hydrataci neshodly.
 */

const DOTS = Array.from({ length: 34 }, (_, i) => {
  // Zlatý řez rozhází body po ploše rovnoměrně a přitom nepravidelně.
  const left = ((i * 34.618) % 100)
  const top = ((i * 61.803) % 100)
  return {
    left,
    top,
    duration: 6 + ((i * 7) % 5),
    delay: -((i * 13) % 9),
    size: i % 5 === 0 ? 3 : 2,
  }
})

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
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      <motion.div
        className="absolute inset-0 opacity-[0.35] dark:opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, var(--color-foreground) 1px, transparent 1px)',
          backgroundSize: gridSize,
          backgroundPosition: gridPosition,
          maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 78%)',
        }}
      />

      <motion.div className="absolute inset-0" style={{ x: orbX, y: orbY }}>
        <div className="absolute -left-20 top-[12%] h-[38rem] w-[38rem] rounded-full bg-primary/20 blur-[120px] motion-safe:animate-[map-drift_26s_ease-in-out_infinite]" />
        <div className="absolute -right-24 bottom-[8%] h-[34rem] w-[34rem] rounded-full bg-accent/20 blur-[120px] motion-safe:animate-[map-drift_32s_ease-in-out_infinite_reverse]" />
        <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[140px]" />
      </motion.div>

      <div className="absolute inset-0 hidden md:block">
        {DOTS.map((dot, index) => (
          <span
            key={index}
            className="absolute rounded-full bg-accent/50 motion-safe:animate-[map-twinkle_var(--dot-duration)_ease-in-out_infinite]"
            style={
              {
                left: `${dot.left}%`,
                top: `${dot.top}%`,
                width: dot.size,
                height: dot.size,
                animationDelay: `${dot.delay}s`,
                '--dot-duration': `${dot.duration}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Změkčuje hranu mapy proti hlavičce a proti sekci pod ní, aby bubliny
          u kraje nekončily useknuté. */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/70 to-transparent" />
    </div>
  )
}
