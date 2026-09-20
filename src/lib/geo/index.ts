import { CZ_IPV4, CZ_IPV6, SK_IPV4, SK_IPV6 } from './ranges'

/**
 * Hrubá geolokace podle IP - jen „je to Česko / Slovensko?".
 *
 * Důvod, proč tohle vůbec existuje: Čech s anglicky nastaveným prohlížečem
 * posílá `Accept-Language: en-US,en`, takže podle samotné hlavičky bychom mu
 * naservírovali angličtinu. IP je jediný signál, který tohle rozliší.
 *
 * Nerozlišujeme víc zemí schválně. Pro zbytek Evropy je Accept-Language
 * spolehlivý (Němec má německý prohlížeč) a tabulka pro všech dvanáct zemí by
 * měla přes 40 tisíc rozsahů místo dvou a půl.
 */

export type Country = 'CZ' | 'SK'

/** Hledá v seřazeném plochém poli [start, konec, start, konec, …]. */
function contains<T extends number | bigint>(ranges: readonly T[], value: T): boolean {
  let low = 0
  let high = ranges.length / 2 - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    const start = ranges[mid * 2]
    const end = ranges[mid * 2 + 1]

    if (value < start) high = mid - 1
    else if (value > end) low = mid + 1
    else return true
  }

  return false
}

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null

  let result = 0
  for (const part of parts) {
    // Odmítáme i "01" a "1e2": Number() by je vzal, ale v IP adrese nejsou.
    if (!/^\d{1,3}$/.test(part)) return null
    const octet = Number(part)
    if (octet > 255) return null
    result = result * 256 + octet
  }

  return result
}

/** Horních 64 bitů IPv6 adresy - na určení země to stačí. */
function ipv6ToHigh64(ip: string): bigint | null {
  // IPv4-mapped (::ffff:1.2.3.4) řeší volající, sem se dostat nemá.
  if (!/^[0-9a-f:]+$/i.test(ip) || !ip.includes(':')) return null

  const [head, tail] = ip.split('::')
  const headParts = head ? head.split(':').filter(Boolean) : []
  const tailParts = tail ? tail.split(':').filter(Boolean) : []

  if (!ip.includes('::') && headParts.length !== 8) return null

  const missing = 8 - headParts.length - tailParts.length
  if (missing < 0) return null

  const groups = [...headParts, ...Array(ip.includes('::') ? missing : 0).fill('0'), ...tailParts]
  if (groups.length !== 8) return null

  let result = 0n
  // Jen první čtyři skupiny = horních 64 bitů.
  for (const group of groups.slice(0, 4)) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return null
    result = (result << 16n) | BigInt(parseInt(group, 16))
  }

  return result
}

/** Země návštěvníka, nebo null když ji neumíme určit. */
export function countryOfIp(ip: string | null | undefined): Country | null {
  if (!ip) return null

  const address = ip.trim().toLowerCase()

  // IPv4 i IPv4 zabalená do IPv6 (::ffff:81.0.0.1), jak ji posílají
  // dual-stack proxy.
  const v4 = address.startsWith('::ffff:') ? address.slice(7) : address

  if (v4.includes('.')) {
    const value = ipv4ToNumber(v4)
    if (value === null) return null
    if (contains(CZ_IPV4, value)) return 'CZ'
    if (contains(SK_IPV4, value)) return 'SK'
    return null
  }

  const high = ipv6ToHigh64(address)
  if (high === null) return null
  if (contains(CZ_IPV6, high)) return 'CZ'
  if (contains(SK_IPV6, high)) return 'SK'
  return null
}

/**
 * IP návštěvníka za reverzní proxy.
 *
 * Caddy je nastavený tak, aby X-Forwarded-For PŘEPSAL, ne rozšířil
 * (`header_up X-Forwarded-For {remote_host}` v deploy/Caddyfile) - jinak by si
 * hlavičku mohl podvrhnout sám návštěvník a vybrat si jazyk cizí adresou.
 * Kontejner navíc poslouchá jen na loopbacku, takže jiná cesta dovnitř není.
 */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null
  return headers.get('x-real-ip')
}
