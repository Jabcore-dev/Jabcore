/**
 * Public addresses of the two sites this app serves.
 *
 * Both are baked in at build time: Next inlines NEXT_PUBLIC_* during
 * compilation, so test and production have their own image (same as
 * profiartstudio-web). The defaults are production, so a plain `npm run dev`
 * behaves like it always did.
 *
 * Every BASE_URL in the codebase reads from here — a hardcoded domain would
 * make the test instance advertise the production URL in its canonicals and
 * sitemap, which is exactly how a test site ends up indexed.
 */

/** Main marketing site. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jabcore.cz'

/** Portfolio one-pager, served by this same app on its own host. */
export const PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? 'https://portfolio.jabcore.cz'

/** 'production' | 'test' — test deployments opt out of indexing. */
export const SITE_ENV = process.env.NEXT_PUBLIC_SITE_ENV ?? 'production'

export const IS_PRODUCTION = SITE_ENV === 'production'

/** Hostname of the portfolio site, used by middleware to route by Host header. */
export const PORTFOLIO_HOST = new URL(PORTFOLIO_URL).host
