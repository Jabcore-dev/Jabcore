import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-bold">Stránka nenalezena</h2>
        <p className="text-muted-foreground">Stránka, kterou hledáte, neexistuje.</p>
        <Link href="/" className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Zpět na hlavní stránku
        </Link>
      </div>
    </div>
  )
}
