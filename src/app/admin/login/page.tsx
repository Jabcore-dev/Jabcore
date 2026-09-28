import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const ERRORS: Record<string, string> = {
  denied: 'Tenhle účet do administrace přístup nemá. Požádej vlastníka, ať tě přidá.',
  unavailable: 'Přihlášení se nepodařilo dokončit. Zkus to znovu.',
  'invalid-callback': 'Přihlášení vypršelo nebo bylo přerušené. Zkus to znovu.',
  'not-configured': 'Přihlašování není na tomhle prostředí nastavené (chybí OIDC_CLIENT_ID).',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const { next, error } = await searchParams
  const start = next ? `/admin/login/start?next=${encodeURIComponent(next)}` : '/admin/login/start'

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-display)' }}>Administrace</CardTitle>
          <CardDescription>Přihlaste se účtem Jabcore pro správu obsahu webu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {ERRORS[error] ?? ERRORS.unavailable}
            </p>
          )}
          {/* A plain link, not a form: the start route answers with a redirect
              to the platform, which a server action could not follow. */}
          <Button asChild className="w-full">
            <a href={start}>Přihlásit přes Jabcore</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
