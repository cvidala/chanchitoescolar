'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-4xl mb-3">🐷</p>
        <h2 className="text-lg font-bold text-[#1E293B] mb-1">Algo salió mal</h2>
        <p className="text-sm text-[#64748B] mb-4">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-[#F97316] text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition">
          Intentar de nuevo
        </button>
      </div>
    </main>
  )
}
