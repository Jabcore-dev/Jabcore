import type { DetailedHTMLProps, HTMLAttributes } from 'react'

/**
 * Vlastní elementy `x-*`.
 *
 * Místo <div className="…"> se ve vlastních komponentách používají pojmenované
 * elementy: <x-card-media>, <x-map-scene>, <x-bubble-title>. Značka pak říká,
 * co to je, styl se na ni věší v CSS podle jména a nepotřebuje k tomu žádnou
 * třídu. Element s pomlčkou v názvu je platné HTML (custom element), takže to
 * projde validátorem i čtečkami.
 *
 * Sémantické značky tím nikdo nenahrazuje - h1, p, a, ul, section, article,
 * header, footer a dl zůstávají tam, kde patří. `x-*` nahrazuje jen <div>,
 * který sám o sobě stejně nic neznamená, takže se o SEO nepřichází.
 *
 * Vzorové jméno místo výčtu: slovník žije v CSS (elements.css), ne tady.
 * Kdyby se každé jméno muselo psát dvakrát, jedna z těch kopií se dřív nebo
 * později rozejde.
 */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [tag: `x-${string}`]: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}
