import { headers } from 'next/headers'
import { PORTFOLIO_HOST } from './site-config'

/**
 * Whether the current request came in on the portfolio domain.
 *
 * robots.txt and sitemap.xml are one route each but serve two sites, so they
 * have to look at the Host header. Everything else routes in middleware, which
 * cannot help here: paths containing a dot are excluded from its matcher.
 *
 * Reading headers() opts the route out of static rendering - which is the
 * point, since one prerendered copy could only ever describe one of the hosts.
 */
export async function isPortfolioHost(): Promise<boolean> {
  const host = (await headers()).get('host')?.toLowerCase() ?? ''
  // Port stripped so this also works locally, where both sites answer on :3000.
  return host.split(':')[0] === PORTFOLIO_HOST.split(':')[0]
}
