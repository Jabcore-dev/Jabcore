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

  /*
   * Počáteční rozmístění, ze kterého pak relaxace poskládá výslednou mapu.
   *
   * První projekt (podle ručního pořadí z adminu, volající ho předá
   * seřazené) jde doprostřed - to, co má obchodník ukázat jako první, je
   * uprostřed. Ostatní se rozestaví do kruhu kolem něj a každý obor dostane
   * souvislou výseč: projekty stejného oboru tak začínají vedle sebe a jejich
   * barevná čára je krátká. Dřív se sely po spirále bez ohledu na obor a dva
   * projekty z průmyslu klidně skončily na opačných koncích mapy.
   *
   * Obory jdou v pořadí, v jakém se v seznamu poprvé objeví, a obor prvního
   * projektu začíná hned vedle něj. Oblíbenost pořadí nemění - přepnutí
   * hvězdičky nesmí přeskládat mapu.
   */
  const groupOf = (project: MapProject) => project.industry ?? ''
  const groupOrder = [...new Set(projects.map(groupOf))]
  const ring = projects
    .map((project, index) => ({ project, index }))
    .slice(1)
    .sort(
      (a, b) =>
        groupOrder.indexOf(groupOf(a.project)) - groupOrder.indexOf(groupOf(b.project)) ||
        a.index - b.index,
    )
  const ringPosition = new Map(ring.map((item, position) => [item.index, position]))
  // Obvod kruhu tak, aby se bubliny vešly vedle sebe i s mezerou.
  const ringRadius = Math.max(2.4 * NORMAL_RADIUS, (ring.length * (2 * NORMAL_RADIUS + GAP)) / (2 * Math.PI))

  const nodes: MapNode[] = projects.map((project, index) => {
    const seed = hash(project.slug)
    const r = radiusOf(project, seed)
    const position = ringPosition.get(index)
    const angle = position === undefined ? 0 : (position / ring.length) * 2 * Math.PI
    const distance = position === undefined ? 0 : ringRadius

    return {
      id: project.id,
      slug: project.slug,
      x: Math.cos(angle) * distance * 1.15,
      // Svisle stlačené už při setí - relaxace tvar dorovná, ne obrátí.
      y: Math.sin(angle) * distance * 0.6,
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

        /*
         * Projekty stejného oboru se k sobě přitahují, takže obory skončí
         * pohromadě. Bez toho mohly dva projekty z průmyslu ležet na opačných
         * koncích mapy a jejich barevná čára vedla přes celou scénu pod
         * cizími bublinami, jako by spojovala úplně jiné projekty.
         */
        if (distance > minimum) {
          const industry = projects[i].industry
          if (industry && industry === projects[j].industry) {
            const pull = (distance - minimum) * 0.02
            const ux = dx / distance
            const uy = dy / distance
            a.x += ux * pull
            a.y += uy * pull
            b.x -= ux * pull
            b.y -= uy * pull
          }
          continue
        }

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

  /*
   * Závěrečné rozestrkání bez přitahování. Přitažlivost oborů a tah ke středu
   * se s odstrkováním do poslední chvíle přetahují a pár bublin by zůstalo
   * přes sebe; tady už se jen rozestupují, dokud se nepřekrývá nic.
   */
  for (let iteration = 0; iteration < 200; iteration += 1) {
    let moved = false

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.hypot(dx, dy) || 0.001
        const minimum = a.r + b.r + GAP

        if (distance >= minimum - 0.5) continue

        moved = true
        const push = (minimum - distance) / 2
        a.x -= (dx / distance) * push
        a.y -= (dy / distance) * push
        b.x += (dx / distance) * push
        b.y += (dy / distance) * push
      }
    }

    if (!moved) break
  }

  for (const node of nodes) {
    node.x = Math.round(node.x * 100) / 100
    node.y = Math.round(node.y * 100) / 100
  }

  return { nodes, links: buildLinks(projects, nodes), bounds: boundsOf(nodes) }
}

/** Vede úsečka mezi dvěma uzly pod cizí bublinou? */
function crossesOtherBubble(a: number, b: number, nodes: MapNode[]): boolean {
  const A = nodes[a]
  const B = nodes[b]
  const dx = B.x - A.x
  const dy = B.y - A.y
  const length = dx * dx + dy * dy || 1

  return nodes.some((node, index) => {
    if (index === a || index === b) return false
    const t = Math.max(0, Math.min(1, ((node.x - A.x) * dx + (node.y - A.y) * dy) / length))
    return Math.hypot(A.x + t * dx - node.x, A.y + t * dy - node.y) < node.r
  })
}

/**
 * Nejlevnější síť, která propojí všechny zadané uzly (minimální kostra,
 * Primův algoritmus). Uzlů je jednotky až desítky, takže O(n²) nevadí.
 *
 * Kostra, ne „každý se svým nejbližším": to dřív nechávalo dvojice projektů,
 * které jsou nejblíž sobě navzájem, viset mimo zbytek mapy. Kostra je vždycky
 * souvislá a žádná čára nevede zbytečně.
 *
 * Cena spojnice je její délka; spojnice pod cizí bublinou je výrazně dražší,
 * takže se použije, jen když bez ní síť nejde propojit.
 */
function spanningTree(indexes: number[], nodes: MapNode[]): [number, number][] {
  if (indexes.length < 2) return []

  const cost = (a: number, b: number) =>
    Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y) *
    (crossesOtherBubble(a, b, nodes) ? 4 : 1)

  const inTree = new Set([indexes[0]])
  const edges: [number, number][] = []

  while (inTree.size < indexes.length) {
    let best: [number, number] | null = null
    let bestCost = Infinity

    for (const from of inTree) {
      for (const to of indexes) {
        if (inTree.has(to)) continue
        const c = cost(from, to)
        if (c < bestCost) {
          bestCost = c
          best = [from, to]
        }
      }
    }

    if (!best) break
    edges.push(best)
    inTree.add(best[1])
  }

  return edges
}

/**
 * Souhvězdí: dvě vrstvy čar.
 *
 *   - tenké: kostra přes všechny projekty - celá mapa je jedna síť,
 *   - barevné: kostra zvlášť pro každý obor - projekty stejného oboru jsou
 *     spojené všechny, ne jen s nejbližším.
 *
 * Kde vede čára v obou vrstvách, zůstane barevná. Dřív to bylo naopak: tenká
 * čára vznikla první a barevná se zahodila jako duplicita, takže dva nejbližší
 * projekty stejného oboru barevnou čáru neměly vůbec.
 *
 * Barevná čára nikdy nevede pod cizí bublinou - vypadala by, že spojuje
 * úplně jiné projekty. Když jinudy nejde, radši chybí; obor pořád ukazuje
 * barva bubliny. Aby takových případů bylo co nejmíň, se projekty stejného
 * oboru při skládání mapy k sobě přitahují.
 */
function buildLinks(projects: MapProject[], nodes: MapNode[]): MapLink[] {
  const links = new Map<string, MapLink>()
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)

  const all = nodes.map((_, index) => index)
  for (const [a, b] of spanningTree(all, nodes)) {
    links.set(key(a, b), { a, b, strong: false })
  }

  const byIndustry = new Map<string, number[]>()
  projects.forEach((project, index) => {
    if (!project.industry) return
    byIndustry.set(project.industry, [...(byIndustry.get(project.industry) ?? []), index])
  })

  for (const members of byIndustry.values()) {
    for (const [a, b] of spanningTree(members, nodes)) {
      if (crossesOtherBubble(a, b, nodes)) continue
      links.set(key(a, b), { a, b, strong: true })
    }
  }

  return [...links.values()]
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
