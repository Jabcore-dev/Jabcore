'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Mail, Phone, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ContactMessage } from '@/db/schema'
import {
  setMessageStatus,
  setMessageNote,
  deleteMessage,
  STATUS_LABELS,
  type MessageStatus,
} from '@/app/admin/actions/contacts'

const STATUS_ORDER: MessageStatus[] = ['new', 'in_progress', 'done', 'spam']

const STATUS_STYLES: Record<MessageStatus, string> = {
  new: 'bg-primary text-primary-foreground',
  in_progress: 'bg-amber-500 text-white',
  done: 'bg-emerald-600 text-white',
  spam: 'bg-muted text-muted-foreground',
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessagesManager({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter()
  const [open, setOpen] = useState<ContactMessage | null>(null)
  const [deleting, setDeleting] = useState<ContactMessage | null>(null)
  const [note, setNote] = useState('')
  const [filter, setFilter] = useState<MessageStatus | 'all'>('all')
  const [pending, startTransition] = useTransition()

  const visible = filter === 'all' ? messages : messages.filter((item) => item.status === filter)

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

  function openDetail(message: ContactMessage) {
    setOpen(message)
    setNote(message.note ?? '')

    // Opening a new inquiry marks it as being dealt with, so the sidebar badge
    // reflects what is actually waiting rather than what nobody opened yet.
    if (message.status === 'new') {
      startTransition(async () => {
        await setMessageStatus(message.id, 'in_progress')
        router.refresh()
      })
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Poptávky
        </h1>
        <p className="text-sm text-muted-foreground">
          Zprávy z kontaktního formuláře. Ukládají se i když se e-mail nedoručí.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setFilter('all')}>
          <Badge variant={filter === 'all' ? 'default' : 'outline'} className="cursor-pointer">
            Vše ({messages.length})
          </Badge>
        </button>
        {STATUS_ORDER.map((status) => {
          const count = messages.filter((item) => item.status === status).length
          return (
            <button key={status} type="button" onClick={() => setFilter(status)}>
              <Badge
                variant={filter === status ? 'default' : 'outline'}
                className="cursor-pointer"
              >
                {STATUS_LABELS[status]} ({count})
              </Badge>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-12 text-center text-muted-foreground">
          Žádné zprávy.
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Stav</TableHead>
                <TableHead>Od</TableHead>
                <TableHead className="hidden md:table-cell">Zpráva</TableHead>
                <TableHead className="w-36">Přijato</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {visible.map((message) => (
                <TableRow
                  key={message.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(message)}
                >
                  <TableCell>
                    <Badge className={cn('font-normal', STATUS_STYLES[message.status as MessageStatus])}>
                      {STATUS_LABELS[message.status as MessageStatus] ?? message.status}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">{message.name}</div>
                    <div className="text-xs text-muted-foreground">{message.email}</div>
                  </TableCell>

                  <TableCell className="hidden max-w-md truncate text-muted-foreground md:table-cell">
                    {message.message}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(message.createdAt)}
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      onClick={(event) => {
                        // The row itself opens the detail.
                        event.stopPropagation()
                        setDeleting(message)
                      }}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Smazat</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open !== null} onOpenChange={(value) => !value && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.name}</DialogTitle>
                <DialogDescription>{formatDate(open.createdAt)}</DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="grid gap-2 text-sm">
                  <a href={`mailto:${open.email}`} className="flex items-center gap-2 hover:underline">
                    <Mail className="size-4 text-muted-foreground" />
                    {open.email}
                  </a>
                  {open.phone && (
                    <a href={`tel:${open.phone}`} className="flex items-center gap-2 hover:underline">
                      <Phone className="size-4 text-muted-foreground" />
                      {open.phone}
                    </a>
                  )}
                  {open.company && (
                    <span className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      {open.company}
                    </span>
                  )}
                  {open.locale && (
                    <span className="text-xs text-muted-foreground">
                      Psáno v jazyce: {open.locale.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
                  {open.message}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Interní poznámka</Label>
                  <Textarea
                    id="note"
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Nezobrazuje se odesílateli."
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => run(() => setMessageNote(open.id, note), 'Poznámka uložena.')}
                  >
                    Uložit poznámku
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Stav</Label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_ORDER.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={open.status === status ? 'default' : 'outline'}
                        disabled={pending}
                        onClick={() => {
                          setOpen({ ...open, status })
                          run(
                            () => setMessageStatus(open.id, status),
                            `Označeno jako „${STATUS_LABELS[status]}".`,
                          )
                        }}
                      >
                        {STATUS_LABELS[status]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(null)}>
                  Zavřít
                </Button>
                <Button asChild>
                  <a href={`mailto:${open.email}?subject=Re: Poptávka - Jabcore`}>Odpovědět</a>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(value) => !value && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Smazat zprávu?</DialogTitle>
            <DialogDescription>
              Od {deleting?.name}. Tohle se nedá vrátit.
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
                run(() => deleteMessage(id), 'Zpráva smazána.')
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
