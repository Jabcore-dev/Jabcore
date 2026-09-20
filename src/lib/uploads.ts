import 'server-only'
import { join, normalize } from 'node:path'

/**
 * Where uploaded images live.
 *
 * Outside public/: that directory is baked into the Docker image at build
 * time, so anything written there at runtime disappears on the next deploy.
 * This path is a mounted volume (docker-compose.prod.yml) and is served by
 * the /uploads route handler.
 */
export const UPLOADS_DIR = process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads')

/** Public URL of a stored file. */
export function uploadUrl(filename: string): string {
  return `/uploads/${filename}`
}

/**
 * Resolves a requested name to a path inside UPLOADS_DIR, or null.
 *
 * The name comes from a URL, so "../../etc/passwd" has to stop here — the
 * check is on the resolved path, because a name can escape the directory
 * without containing ".." literally once it is decoded and normalised.
 */
export function resolveUploadPath(name: string): string | null {
  if (!name || name.includes('\0')) return null

  const resolved = normalize(join(UPLOADS_DIR, name))
  const root = normalize(UPLOADS_DIR)

  return resolved.startsWith(`${root}/`) ? resolved : null
}
