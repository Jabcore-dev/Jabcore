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
  /** Obrazek se ulozil, ale na webu nebude vypadat idealne. */
  warning?: string
}

/**
 * Doporuceny pomer stran.
 *
 * Obrazek se zobrazuje na trech mistech s ruznymi pomery: karta v seznamu je
 * 16:10, detail reference 16:9 a nahled pri sdileni na socialnich sitich
 * 1,91:1. Vsude se orezava na stred, takze 16:9 je jediny pomer, ktery lezi
 * mezi nimi - z kazde strany se ustrihne par procent misto ctvrtiny obrazku.
 */
const TARGET_RATIO = 16 / 9

/** Nejuzsi a nejsirsi pomer, ktery jeste orez prezije bez ztraty obsahu. */
const MIN_RATIO = 1.5
const MAX_RATIO = 2.0

/** Detail reference se vykresluje 1024 px siroky, na retine tedy 2048. */
const MIN_WIDTH = 1200

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

    const { width = 0, height = 0 } = await sharp(input).metadata()
    const ratio = height > 0 ? width / height : TARGET_RATIO

    // Nahrani nikdy neblokujeme - editor vi nejlip, jaky obrazek ma. Jen
    // rekneme nahlas, co se s nim na webu stane.
    let warning: string | undefined
    if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
      warning = `Obrázek má poměr ${ratio.toFixed(2)}:1, doporučený je 1,78:1 (16:9). Na kartách a při sdílení se z něj ořízne víc, než je zdrávo.`
    } else if (width > 0 && width < MIN_WIDTH) {
      warning = `Obrázek je široký jen ${width} px. Na detailu reference se roztáhne na 1024 px, takže bude rozmazaný. Doporučeno alespoň ${MIN_WIDTH} px.`
    }

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

    return { ok: true, url: uploadUrl(filename), warning }
  } catch (error) {
    console.error('upload obrázku selhal', error)
    return { ok: false, error: 'Obrázek se nepodařilo zpracovat.' }
  }
}
