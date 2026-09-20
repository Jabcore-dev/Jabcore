'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Inbox, Users, LayoutDashboard, LogOut, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { SessionPayload } from '@/lib/auth/session'

const items = [
  { href: '/admin', label: 'Přehled', icon: LayoutDashboard },
  { href: '/admin/reference', label: 'Reference', icon: FileText },
  { href: '/admin/kontakty', label: 'Poptávky', icon: Inbox, badgeKey: 'newMessages' as const },
  { href: '/admin/uzivatele', label: 'Uživatelé', icon: Users, ownerOnly: true },
]

export default function AdminShell({
  session,
  newMessages,
  signOutAction,
  children,
}: {
  session: SessionPayload
  newMessages: number
  signOutAction: () => Promise<void>
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname.startsWith(href)

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-border lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-6 p-4 lg:p-6">
          <div>
            <Link href="/admin" className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Jabcore
            </Link>
            <p className="text-xs text-muted-foreground">Administrace</p>
          </div>

          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {items
              .filter((item) => !item.ownerOnly || session.role === 'owner')
              .map((item) => {
                const Icon = item.icon
                const badge = item.badgeKey === 'newMessages' ? newMessages : 0

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors',
                      isActive(item.href)
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                    {badge > 0 && (
                      <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
          </nav>

          <div className="mt-auto hidden space-y-3 lg:block">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="size-3" />
              Zobrazit web
            </a>

            <div className="border-t border-border pt-3">
              <p className="truncate text-sm font-medium">{session.name ?? session.email}</p>
              <p className="truncate text-xs text-muted-foreground">
                {session.role === 'owner' ? 'Vlastník' : 'Editor'}
              </p>
            </div>

            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 px-0">
                <LogOut className="size-4" />
                Odhlásit se
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-8">{children}</main>
    </div>
  )
}
