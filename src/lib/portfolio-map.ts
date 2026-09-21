/**
 * Rozmístění projektů na bublinové mapě portfolia.
 *
 * Čistá, deterministická funkce: ze stejného seznamu referencí vyjde vždycky
 * stejná mapa. To je tu podmínka, ne estetika - komponenta mapy se renderuje
 * na serveru i v prohlížeči a jakákoliv náhoda uvnitř by skončila hydration
 * mismatchem. Kdykoliv je potřeba „náhoda" (velikost bubliny, fáze plavání),
 * bere se z hashe slugu.
 *
 * Souřadnice jsou ve „světových" jednotkách, ne v pixelech. Plátno si je
 * přepočítá podle toho, jak je zrovna velké okno a jak je mapa přiblížená.
 */

/** Co z reference mapa opravdu potřebuje - tohle jede přes hranici na klienta. */
export interface MapProject {
  id: number
  slug: string
  title: string
  clientName: string
  year: number | null
  industry: string | null
  industryLabel: string | null
  /**
   * Odstín barvy oboru (0-360, oklch). Bublina, spojnice i tečka ve filtru ho
   * sdílí, takže filtr zároveň funguje jako legenda mapy.
   */
  hue: number
  coverImage: string | null
  summary: string | null
  tech: string[]
  featured: boolean
  projectUrl: string | null
  testimonial: string | null
  testimonialAuthor: string | null
}

export interface MapNode {
  id: number
  slug: string
  /** Střed bubliny ve světových jednotkách. */
  x: number
  y: number
  /** Poloměr bubliny ve světových jednotkách. */
  r: number
  /** Fáze a délka poklidného plavání - aby se bubliny nehýbaly jako jeden kus. */
  floatDelay: number
  floatDuration: number
}

/** Spojnice mezi dvěma uzly, indexy do pole nodes. */
export interface MapLink {
  a: number
  b: number
  /** Stejný obor = výraznější čára; jinak jen „soused". */
  strong: boolean
}

export interface MapBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export interface MapLayout {
  nodes: MapNode[]
  links: MapLink[]
  bounds: MapBounds
}

/** FNV-1a. Krátké, bez závislostí a pro jména slugů dost rozházené. */
function hash(value: string): number {
  let out = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    out ^= value.charCodeAt(i)
    out = Math.imul(out, 0x01000193)
  }
  return out >>> 0
}

/** Číslo 0-1 odvozené ze stejného hashe, ale pro jiný účel (sůl). */
function unit(seed: number, salt: number): number {
  const mixed = Math.imul(seed ^ Math.imul(salt + 1, 0x9e3779b9), 0x85ebca6b) >>> 0
  return mixed / 0xffffffff
}

/** Zlatý úhel - rozsévá body tak, aby kolem středu nevznikaly prázdné paprsky. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

/**
 * Mezera mezi bublinami ve světových jednotkách.
 *
 * Ne jen estetika: spojnice souhvězdí vedou od středu ke středu, takže při
 * těsném rozmístění zmizí celé pod bublinami a síť není vidět.
 */
const GAP = 78

const NORMAL_RADIUS = 104

/*
 * Oblíbený projekt velikost bubliny neovlivňuje - dřív byla výrazně větší a to
 * přeskládalo celou mapu i spojnice. Oblíbenost ukazuje jen hvězdička.
 */
function radiusOf(project: MapProject, seed: number): number {
  const base = NORMAL_RADIUS
  // ±8 % podle slugu: mapa pravidelných koleček vypadá jako diagram, mapa
  // s drobnou nepravidelností jako souhvězdí.
  const variation = 0.92 + unit(seed, 1) * 0.16
  // Projekt s delším technologickým seznamem býval větší zakázkou; je to slabý
  // signál, tak ať posune poloměr jen o pár jednotek.
  const weight = Math.min(project.tech.length, 6) * 2.5
  return Math.round(base * variation + weight)
}

/**
 * Sestaví mapu: pozice bublin, spojnice a ohraničení celé scény.
 *
 * Nejdřív se uzly rozesejí po Fermatově spirále (velké doprostřed, menší ven),
 * pak se pár set iterací rozestrkávají, aby se nepřekrývaly, a současně je
 * k sobě táhne slabá síla ke středu - svisle silnější než vodorovně, takže
 * shluk skončí na šířku a sedne do širokoúhlého okna místo do kruhu.
 */
export function buildMapLayout(projects: MapProject[]): MapLayout {
  if (projects.length === 0) {
    return {
      nodes: [],
      links: [],
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, centerX: 0, centerY: 0 },
    }
  }

  // Pořadí je ruční řazení z adminu (volající ho předá seřazené), takže to, co
  // má obchodník ukázat jako první, sedí doprostřed. Oblíbenost pořadí
  // nemění - přepnutí hvězdičky nesmí přeskládat mapu.
  const nodes: MapNode[] = projects.map((project, index) => {
    const seed = hash(project.slug)
    const r = radiusOf(project, seed)
    const spiral = Math.sqrt(index) * 2.15 * NORMAL_RADIUS
    const angle = index * GOLDEN_ANGLE

    return {
      id: project.id,
      slug: project.slug,
      x: Math.cos(angle) * spiral * 1.15,
      // Svisle stlačené už při setí - relaxace tvar dorovná, ne obrátí.
      y: Math.sin(angle) * spiral * 0.6,
      r,
      floatDelay: -unit(seed, 2) * 12,
      floatDuration: 9 + unit(seed, 3) * 7,
    }
  })

  for (let iteration = 0; iteration < 260; iteration += 1) {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.hypot(dx, dy) || 0.001
        const minimum = a.r + b.r + GAP

        if (distance >= minimum) continue

        const push = (minimum - distance) / 2
        const ux = dx / distance
        const uy = dy / distance
        a.x -= ux * push
        a.y -= uy * push
        b.x += ux * push
        b.y += uy * push
      }
    }

    /*
     * Tah ke středu drží mapu pohromadě, aby se po rozestrkání nerozlezla do
     * řídkého mraku. Svisle je mnohem silnější než vodorovně, a proto shluk
     * skončí na šířku: pruh, který mapě zbyde mezi titulkem nahoře
     * a ovládáním dole, je široký a nízký, a kruhová scéna by se do něj
     * musela zmenšit natolik, že by v bublinách nešly přečíst názvy.
     */
    for (const node of nodes) {
      node.x -= node.x * 0.0006
      node.y -= node.y * 0.0052
    }
  }

  for (const node of nodes) {
    node.x = Math.round(node.x * 100) / 100
    node.y = Math.round(node.y * 100) / 100
  }

  return { nodes, links: buildLinks(projects, nodes), bounds: boundsOf(nodes) }
}

/**
 * Souhvězdí: každý uzel se spojí s nejbližším sousedem a navíc s nejbližším
 * projektem ze stejného oboru. Vznikne síť, která na pozadí napoví, co k sobě
 * patří, a přitom nezakryje bubliny pavučinou ze všech do všech.
 */
function buildLinks(projects: MapProject[], nodes: MapNode[]): MapLink[] {
  const seen = new Set<string>()
  const links: MapLink[] = []

  const add = (a: number, b: number, strong: boolean) => {
    if (a === b) return
    const key = a < b ? `${a}-${b}` : `${b}-${a}`
    if (seen.has(key)) return
    seen.add(key)
    links.push({ a, b, strong })
  }

  const nearest = (from: number, predicate?: (index: number) => boolean): number => {
    let best = -1
    let bestDistance = Infinity

    for (let i = 0; i < nodes.length; i += 1) {
      if (i === from) continue
      if (predicate && !predicate(i)) continue
      const distance = Math.hypot(nodes[i].x - nodes[from].x, nodes[i].y - nodes[from].y)
      if (distance < bestDistance) {
        bestDistance = distance
        best = i
      }
    }

    return best
  }

  for (let i = 0; i < nodes.length; i += 1) {
    const neighbour = nearest(i)
    if (neighbour !== -1) add(i, neighbour, false)

    const industry = projects[i].industry
    if (!industry) continue

    const sameIndustry = nearest(i, (index) => projects[index].industry === industry)
    if (sameIndustry !== -1) add(i, sameIndustry, true)
  }

  return links
}

function boundsOf(nodes: MapNode[]): MapBounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const node of nodes) {
    minX = Math.min(minX, node.x - node.r)
    minY = Math.min(minY, node.y - node.r)
    maxX = Math.max(maxX, node.x + node.r)
    maxY = Math.max(maxY, node.y + node.r)
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  }
}
