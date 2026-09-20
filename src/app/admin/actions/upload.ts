'use server'

import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { requireUser } from '@/lib/auth/guard'
import { UPLOADS_DIR, uploadUrl, resolveUploadPath } from '@/lib/uploads'

/** Bigger than this and somebody is uploading a camera original by mistake. */
const MAX_BYTES = 12 * 1024 * 1024

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

export interface UploadResult {
  ok: boolean
  url?: string
  error?: string
}

/**
 * Stores one image and returns its public URL.
 *
 * Re-encoded to WebP at a sane width rather than stored as sent: a 6 MB phone
 * photo dropped into a card would otherwise be downloaded by every visitor at
 * full size. The name is random, so saving a new image never overwrites the
 * one a published page still points at.
 */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  await requireUser()

  const file = formData.get('file')

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Nebyl vybrán žádný soubor.' }
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Obrázek je větší než 12 MB.' }
  }

  if (!ACCEPTED.includes(file.type)) {
    return { ok: false, error: 'Podporované formáty: JPG, PNG, WebP, AVIF, GIF.' }
  }

  try {
    const input = Buffer.from(await file.arrayBuffer())

    const output = await sharp(input)
      // withoutEnlargement: a smaller image stays as it is instead of being
      // upscaled into a blurry 2000px version.
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const filename = `${randomUUID()}.webp`
    const target = resolveUploadPath(filename)

    if (!target) return { ok: false, error: 'Neplatný cíl uploadu.' }

    await mkdir(UPLOADS_DIR, { recursive: true })
    await writeFile(target, output)

    return { ok: true, url: uploadUrl(filename) }
  } catch (error) {
    console.error('upload obrázku selhal', error)
    return { ok: false, error: 'Obrázek se nepodařilo zpracovat.' }
  }
}
