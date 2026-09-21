'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { locales } from '@/lib/i18n-config'
import type { AdminReference } from '@/lib/admin-data'
import {
  deleteReference,
  setPublished,
  setFeatured,
  reorderReferences,
} from '@/app/admin/actions/references'
import ReferenceDialog from './ReferenceDialog'

export default function ReferencesManager({
  references,
  industryOptions,
  canTranslate,
}: {
  references: AdminReference[]
  industryOptions: { key: string; label: string }[]
  /** Je nastavený GEMINI_API_KEY - bez něj se tlačítka překladu neukazují. */
  canTranslate: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<AdminReference | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<AdminReference | null>(null)
  const [pending, startTransition] = useTransition()

  function openEditor(reference: AdminReference | null) {
    setEditing(reference)
    setDialogOpen(true)
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        toast.error(result.error ?? 'Akce selhala.')
        return
      }
      toast.success(success)
      router.refresh()
    })
  }

  /** Moves one row and writes the new order of the whole list. */
  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= references.length) return

    const ids = references.map((reference) => reference.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]

    run(() => reorderReferences(ids), 'Pořadí uloženo.')
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Reference
          </h1>
          <p className="text-sm text-muted-foreground">
            Zobrazují se na webu i na portfolio.jabcore.cz.
          </p>
        </div>

        <Button onClick={() => openEditor(null)} className="gap-2">
          <Plus className="size-4" />
          Nová reference
        </Button>
      </div>

      {references.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-12 text-center text-muted-foreground">
          Zatím žádné reference. Začni tlačítkem „Nová reference".
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Pořadí</TableHead>
                <TableHead>Název</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Překlady</TableHead>
                <TableHead className="w-24">Publikováno</TableHead>
                <TableHead className="w-16">Top</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {references.map((reference, index) => (
                <TableRow key={reference.id}>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={index === 0 || pending}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp className="size-3.5" />
                        <span className="sr-only">Posunout nahoru</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        disabled={index === references.length - 1 || pending}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown className="size-3.5" />
                        <span className="sr-only">Posunout dolů</span>
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell className="font-medium">
                    {reference.translations.cs?.title ?? reference.slug}
                    <div className="text-xs text-muted-foreground">/{reference.slug}</div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {reference.clientName}
                    {reference.year && <span className="ml-1 text-xs">({reference.year})</span>}
                  </TableCell>

                  <TableCell>
                    {/* Count, not a list of twelve flags - the editor shows
                        which ones are missing. */}
                    <Badge variant={reference.filledLocales.length === locales.length ? 'default' : 'secondary'}>
                      {reference.filledLocales.length} / {locales.length}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={reference.published}
                      disabled={pending}
                      onCheckedChange={(checked) =>
                        run(
                          () => setPublished(reference.id, checked),
                          checked ? 'Publikováno.' : 'Skryto.',
                        )
                      }
                    />
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => setFeatured(reference.id, !reference.featured),
                          reference.featured ? 'Zvýraznění zrušeno.' : 'Zvýrazněno.',
                        )
                      }
                    >
                      <Star
                        className={
                          reference.featured
                            ? 'size-4 fill-amber-400 text-amber-400'
                            : 'size-4 text-muted-foreground'
                        }
                      />
                      <span className="sr-only">Zvýraznit</span>
                    </Button>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEditor(reference)}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Upravit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleting(reference)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Smazat</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Keyed so the editor starts from the right reference every time it is
          opened, instead of keeping the previous one's state. */}
      {dialogOpen && (
        <ReferenceDialog
          key={editing?.id ?? 'new'}
          reference={editing}
          industryOptions={industryOptions}
          canTranslate={canTranslate}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSaved={() => router.refresh()}
        />
      )}

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Smazat referenci?</DialogTitle>
            <DialogDescription>
              {deleting?.translations.cs?.title ?? deleting?.slug} i se všemi překlady. Tohle se
              nedá vrátit.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Zrušit
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                const id = deleting?.id
                if (!id) return
                setDeleting(null)
                run(() => deleteReference(id), 'Reference smazána.')
              }}
            >
              Smazat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
