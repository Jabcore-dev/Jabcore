/**
 * Obory referencí - pevný seznam, ze kterého se v adminu vybírá.
 *
 * V databázi je jen klíč (`prumysl`), popisky jsou v locale JSON pod
 * `references.industries.<klíč>` a jsou přeložené do všech jazyků. Admin tak
 * obor jen zvolí a veřejný web ho ukáže v jazyce návštěvníka; volný text by
 * skončil jako „Průmysl" na anglické stránce a „průmysl" vedle „Průmysl" ve
 * filtru.
 *
 * Nový obor = řádek tady + popisek ve všech locale souborech. Klíč se už
 * nikdy nemění: je uložený u referencí a přejmenování by je od oboru odpojilo.
 *
 * `hue` je odstín barvy (oklch, 0-360), kterou obor dostane na mapě
 * portfolia: obrys bubliny, spojnice a tečka ve filtru. Pevně u oboru, ne podle
 * pořadí - jinak by přidání reference z nového oboru přebarvilo všechny ostatní.
 *
 * Pořadí seznamu je pořadí v adminu i ve filtru na webu.
 */
export const INDUSTRIES = [
  { key: 'prumysl', hue: 30 },
  { key: 'ecommerce', hue: 265 },
  { key: 'verejna-sprava', hue: 195 },
  { key: 'zdravotnictvi', hue: 350 },
  { key: 'finance', hue: 150 },
  { key: 'doprava', hue: 225 },
  { key: 'energetika', hue: 110 },
  { key: 'stavebnictvi', hue: 55 },
  { key: 'vzdelavani', hue: 85 },
  { key: 'technologie', hue: 245 },
  { key: 'media', hue: 295 },
  { key: 'cestovni-ruch', hue: 320 },
  { key: 'sluzby', hue: 175 },
  { key: 'zemedelstvi', hue: 130 },
  { key: 'neziskovy-sektor', hue: 10 },
] as const

export type IndustryKey = (typeof INDUSTRIES)[number]['key']

export const INDUSTRY_KEYS = INDUSTRIES.map((industry) => industry.key) as [
  IndustryKey,
  ...IndustryKey[],
]

/** Barva pro referenci bez oboru nebo se starým klíčem mimo seznam. */
export const DEFAULT_INDUSTRY_HUE = 195

export function industryHue(key: string | null | undefined): number {
  return INDUSTRIES.find((industry) => industry.key === key)?.hue ?? DEFAULT_INDUSTRY_HUE
}

export function isIndustryKey(value: string | null | undefined): value is IndustryKey {
  return INDUSTRIES.some((industry) => industry.key === value)
}
