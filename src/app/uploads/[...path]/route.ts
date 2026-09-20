import { readFile, stat } from 'node:fs/promises'
import { extname } from 'node:path'
import { NextResponse } from 'next/server'
import { resolveUploadPath } from '@/lib/uploads'

/**
 * Serves uploaded images from the volume.
 *
 * A route rather than public/: files written to public/ at runtime are lost on
 * the next deploy, because that directory is part of the image. Serving them
 * here also means one place decides the cache headers.
 */
const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const filePath = resolveUploadPath(path.join('/'))

  if (!filePath) return new NextResponse('Not found', { status: 404 })

  const type = CONTENT_TYPES[extname(filePath).toLowerCase()]
  if (!type) return new NextResponse('Not found', { status: 404 })

  try {
    const [file, stats] = await Promise.all([readFile(filePath), stat(filePath)])

    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': type,
        'Content-Length': String(stats.size),
        /*
         * Uploads are immutable: saving a new image writes a new filename, so
         * the same URL always returns the same bytes and can be cached hard.
         */
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
