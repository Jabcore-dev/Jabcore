'use client'

import { Children, useEffect, useRef, useState } from 'react'

/**
 * Karusel referencí na homepage - jen na telefonu a tabletu.
 *
 * Posouvání je čisté CSS (scroll-snap): prst to umí nativně, klávesnice taky
 * a karty zůstávají obyčejné HTML ze serveru - vyhledávač vidí každou jednou,
 * se všemi odkazy. Nic se nezdvojuje kvůli nekonečné smyčce a nic se samo
 * nehýbe. JavaScript přidává jen dvě věci navrch:
 *
 *   - tečky, které ukazují, kde v řadě návštěvník je,
 *   - tažení myší, protože myš (na rozdíl od prstu) vodorovně rolovat neumí.
 *
 * Na desktopu jsou karty v mřížce vedle sebe a tohle všechno CSS vypne.
 */
export default function ReferenceRail({
  children,
  slideLabel,
}: {
  children: React.ReactNode
  /** „Reference {n} z {total}" - popisek teček pro čtečky. */
  slideLabel: string
}) {
  const railRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const count = Children.count(children)
  const drag = useRef<{ startX: number; startScroll: number; moved: boolean } | null>(null)

  const cards = () =>
    [...(railRef.current?.children ?? [])] as HTMLElement[]

  /** Aktivní je karta, jejíž levý okraj je nejblíž levému okraji řady. */
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const onScroll = () => {
      const offsets = cards().map((card) => Math.abs(card.offsetLeft - rail.offsetLeft - rail.scrollLeft))
      setActive(offsets.indexOf(Math.min(...offsets)))
    }

    rail.addEventListener('scroll', onScroll, { passive: true })
    return () => rail.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToCard = (index: number) => {
    const rail = railRef.current
    const card = cards()[index]
    if (!rail || !card) return
    rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft, behavior: 'smooth' })
  }

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    // Prst a pero rolují nativně a lépe, než by to uměl JavaScript.
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    drag.current = { startX: event.clientX, startScroll: event.currentTarget.scrollLeft, moved: false }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const state = drag.current
    if (!state) return
    const delta = event.clientX - state.startX

    // Do 5 px je to klik na kartu, ne tah.
    if (!state.moved) {
      if (Math.abs(delta) < 5) return
      state.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
      event.currentTarget.dataset.dragging = ''
    }

    event.currentTarget.scrollLeft = state.startScroll - delta
  }

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const state = drag.current
    drag.current = null
    if (!state?.moved) return

    delete event.currentTarget.dataset.dragging
    // Během tahu je přichytávání vypnuté (jinak by s myší bojovalo); po puštění
    // karta dojede na místo sama.
    scrollToCard(active)
    // Klik, který vznikne koncem tahu, nesmí otevřít kartu.
    event.currentTarget.addEventListener('click', (click) => click.preventDefault(), {
      capture: true,
      once: true,
    })
  }

  return (
    <>
      <x-reference-rail
        ref={railRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // Odkaz i obrázek se jinak dají myší „vytáhnout" jako soubor.
        onDragStart={(event) => event.preventDefault()}
      >
        {children}
      </x-reference-rail>

      {count > 1 && (
        <x-rail-dots>
          {Array.from({ length: count }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={slideLabel.replace('{n}', String(index + 1)).replace('{total}', String(count))}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => scrollToCard(index)}
            />
          ))}
        </x-rail-dots>
      )}
    </>
  )
}
