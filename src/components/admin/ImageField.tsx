'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadImage } from '@/app/admin/actions/upload'

/** Upload and preview for the cover image of a reference. */
export default function ImageField({
  value,
  onChange,
}: {
  value: string | null
  onChange: (url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [preview, setPreview] = useState<string | null>(value)

  function handleFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const result = await uploadImage(formData)

      if (!result.ok || !result.url) {
        toast.error(result.error ?? 'Nahrání selhalo.')
        return
      }

      setPreview(result.url)
      onChange(result.url)
      toast.success('Obrázek nahrán.')
    })
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-border bg-muted">
          <Image src={preview} alt="" fill sizes="400px" className="object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => {
              setPreview(null)
              onChange(null)
            }}
          >
            <X className="size-4" />
            <span className="sr-only">Odebrat obrázek</span>
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
        >
          <Upload className="size-6" />
          {pending ? 'Nahrávám…' : 'Nahrát obrázek'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) handleFile(file)
          // Reset, so picking the same file twice in a row still fires change.
          event.target.value = ''
        }}
      />
    </div>
  )
}
