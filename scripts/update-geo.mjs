/**
 * Přegeneruje src/lib/geo/ranges.ts z aktuálních dat RIPE NCC.
 *
 *   npm run geo:update
 *
 * Alokace IP rozsahů se mění řádově jednotky procent ročně, takže tohle stačí
 * pustit jednou za rok. Výsledek se commituje — nestahuje se při buildu, aby
 * deploy nezávisel na dostupnosti RIPE.
 */
import { writeFile } from 'node:fs/promises'

const SOURCE = 'https://ftp.ripe.net/pub/stats/ripencc/delegated-ripencc-extended-latest'
const COUNTRIES = ['CZ', 'SK']

console.log(`▶ Stahuji ${SOURCE}`)
const response = await fetch(SOURCE)
if (!response.ok) throw new Error(`RIPE vrátilo ${response.status}`)
const text = await response.text()

const v4 = Object.fromEntries(COUNTRIES.map((c) => [c, []]))
const v6 = Object.fromEntries(COUNTRIES.map((c) => [c, []]))

for (const line of text.split('\n')) {
  const p = line.split('|')
  // registry|cc|type|start|value|date|status|…
  if (p.length < 7 || !COUNTRIES.includes(p[1])) continue
  if (p[6] !== 'allocated' && p[6] !== 'assigned') continue

  if (p[2] === 'ipv4') {
    const start = p[3].split('.').reduce((acc, o) => acc * 256 + Number(o), 0)
    v4[p[1]].push([start, start + Number(p[4]) - 1])
  } else if (p[2] === 'ipv6') {
    // Horních 64 bitů stačí: alokace jsou /19 až /48.
    const groups = p[3].split('::')[0].split(':').filter(Boolean)
    let high = 0n
    for (let i = 0; i < 4; i++) high = (high << 16n) | BigInt(parseInt(groups[i] ?? '0', 16))
    const hostBits = 64 - Math.min(Number(p[4]), 64)
    v6[p[1]].push([high, high + (1n << BigInt(hostBits)) - 1n])
  }
}

const merge = (ranges) => {
  ranges.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
  const out = []
  for (const [start, end] of ranges) {
    const last = out[out.length - 1]
    if (last && start <= last[1] + (typeof start === 'bigint' ? 1n : 1)) {
      if (end > last[1]) last[1] = end
    } else {
      out.push([start, end])
    }
  }
  return out
}

const today = new Date().toISOString().slice(0, 10)
let output = `/**
 * IP rozsahy Česka a Slovenska, vygenerované z RIPE NCC delegated-extended
 * (${today}).
 *
 * Generuje scripts/update-geo.mjs — needituj ručně.
 */

`

for (const country of COUNTRIES) {
  const m4 = merge(v4[country])
  const m6 = merge(v6[country])
  console.log(`  ${country}: ${m4.length} IPv4, ${m6.length} IPv6`)
  output += `export const ${country}_IPV4: readonly number[] = [${m4.flat().join(',')}]\n\n`
  output += `export const ${country}_IPV6: readonly bigint[] = [${m6.flat().map((v) => `${v}n`).join(',')}]\n\n`
}

await writeFile('src/lib/geo/ranges.ts', output)
console.log('✔ src/lib/geo/ranges.ts přegenerován.')
