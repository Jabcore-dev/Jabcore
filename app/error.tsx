'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Něco se pokazilo</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Zkusit znovu
        </button>
      </div>
    </div>
  )
}
