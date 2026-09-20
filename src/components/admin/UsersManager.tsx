'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, KeyRound, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminUser } from '@/db/schema'
import type { SessionPayload } from '@/lib/auth/session'
import {
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  changeOwnPassword,
} from '@/app/admin/actions/users'

type Role = 'owner' | 'editor'

const ROLE_LABELS: Record<Role, string> = {
  owner: 'Vlastník',
  editor: 'Editor',
}

function formatDate(value: Date | string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

export default function UsersManager({
  users,
  session,
}: {
  users: AdminUser[]
  session: SessionPayload
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [resetting, setResetting] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState<AdminUser | null>(null)
  const [ownPasswordOpen, setOwnPasswordOpen] = useState(false)

  const [form, setForm] = useState({ email: '', name: '', role: 'editor' as Role, password: '' })
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string, after?: () => void) {
    startTransition(async () => {
      const result = await action()
      if (!result.ok) {
        toast.error(result.error ?? 'Akce selhala.')
        return
      }
      toast.success(success)
      after?.()
      router.refresh()
    })
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Uživatelé
          </h1>
          <p className="text-sm text-muted-foreground">
            Vlastník může spravovat účty, editor jen obsah.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOwnPasswordOpen(true)} className="gap-2">
            <KeyRound className="size-4" />
            Moje heslo
          </Button>
          <Button
            onClick={() => {
              setForm({ email: '', name: '', role: 'editor', password: '' })
              setCreateOpen(true)
            }}
            className="gap-2"
          >
            <Plus className="size-4" />
            Přidat uživatele
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Jméno</TableHead>
              <TableHead className="w-28">Role</TableHead>
              <TableHead className="w-36">Poslední přihlášení</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.email}
                  {user.id === session.userId && (
                    <span className="ml-2 text-xs text-muted-foreground">(ty)</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.name ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                    {ROLE_LABELS[user.role as Role] ?? user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(user.lastLoginAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setEditing(user)}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Upravit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setNewPassword('')
                        setResetting(user)
                      }}
                    >
                      <KeyRound className="size-4" />
                      <span className="sr-only">Změnit heslo</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      disabled={user.id === session.userId}
                      onClick={() => setDeleting(user)}
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

      {/* Nový uživatel */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Přidat uživatele</DialogTitle>
            <DialogDescription>Heslo mu předej jinou cestou než e-mailem.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-email">E-mail *</Label>
              <Input
                id="new-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">Jméno</Label>
              <Input
                id="new-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Role</Label>
              <Select
                value={form.role}
                onValueChange={(value) => setForm({ ...form, role: value as Role })}
              >
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor - jen obsah</SelectItem>
                  <SelectItem value="owner">Vlastník - i správa účtů</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Heslo *</Label>
              <Input
                id="new-password"
                type="text"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="min. 10 znaků"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Zrušit
            </Button>
            <Button
              disabled={pending}
              onClick={() => run(() => createUser(form), 'Uživatel vytvořen.', () => setCreateOpen(false))}
            >
              Vytvořit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Úprava uživatele */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          {editing && (
            <>
              <DialogHeader>
                <DialogTitle>Upravit uživatele</DialogTitle>
                <DialogDescription>{editing.email}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Jméno</Label>
                  <Input
                    id="edit-name"
                    value={editing.name ?? ''}
                    onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editing.role}
                    onValueChange={(value) => setEditing({ ...editing, role: value })}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor - jen obsah</SelectItem>
                      <SelectItem value="owner">Vlastník - i správa účtů</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Zrušit
                </Button>
                <Button
                  disabled={pending}
                  onClick={() =>
                    run(
                      () =>
                        updateUser(editing.id, {
                          name: editing.name ?? undefined,
                          role: editing.role as Role,
                        }),
                      'Uloženo.',
                      () => setEditing(null),
                    )
                  }
                >
                  Uložit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset hesla */}
      <Dialog open={resetting !== null} onOpenChange={(open) => !open && setResetting(null)}>
        <DialogContent className="sm:max-w-md">
          {resetting && (
            <>
              <DialogHeader>
                <DialogTitle>Změnit heslo</DialogTitle>
                <DialogDescription>{resetting.email}</DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-2">
                <Label htmlFor="reset-password">Nové heslo</Label>
                <Input
                  id="reset-password"
                  type="text"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="min. 10 znaků"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setResetting(null)}>
                  Zrušit
                </Button>
                <Button
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => resetPassword(resetting.id, newPassword),
                      'Heslo změněno.',
                      () => setResetting(null),
                    )
                  }
                >
                  Změnit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Vlastní heslo */}
      <Dialog open={ownPasswordOpen} onOpenChange={setOwnPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Změnit vlastní heslo</DialogTitle>
            <DialogDescription>Zůstaneš přihlášený.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="current-password">Současné heslo</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="own-new-password">Nové heslo</Label>
              <Input
                id="own-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOwnPasswordOpen(false)}>
              Zrušit
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                run(
                  () => changeOwnPassword(currentPassword, newPassword),
                  'Heslo změněno.',
                  () => {
                    setOwnPasswordOpen(false)
                    setCurrentPassword('')
                    setNewPassword('')
                  },
                )
              }
            >
              Změnit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
