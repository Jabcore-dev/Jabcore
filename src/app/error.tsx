'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">Něco se pokazilo</h2>
      <button onClick={reset} className="text-primary hover:underline">
        Zkusit znovu
      </button>
    </div>
  )
}
