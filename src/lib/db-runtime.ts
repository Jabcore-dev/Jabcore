import { connection } from 'next/server'

/**
 * Keeps a database-backed page out of the build-time prerender when there is
 * no database to read.
 *
 * `next build` runs inside the Docker image build, with no Postgres in reach.
 * Without this, every such page would be prerendered as empty and served from
 * the cache until the next revalidation — a freshly deployed site showing no
 * references at all for an hour.
 *
 * At runtime DATABASE_URL is always set (docker-compose.prod.yml), so this
 * returns immediately and the page is rendered and cached as usual.
 */
export async function skipPrerenderWithoutDatabase(): Promise<void> {
  if (process.env.DATABASE_URL) return
  await connection()
}

/** True when a build-time helper can query the database. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL)
}
