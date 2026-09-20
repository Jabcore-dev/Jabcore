import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Stránka nenalezena</p>
      <Link href="/" className="text-primary hover:underline">
        Zpět na hlavní stránku
      </Link>
    </div>
  )
}
