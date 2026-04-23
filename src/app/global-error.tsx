'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <html lang="es">
      <body className="bg-[#F8FAFC] min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-3">🐷</p>
          <h2 className="text-lg font-bold text-[#1E293B] mb-1">Error inesperado</h2>
          <button onClick={reset} className="px-4 py-2 bg-[#F97316] text-white rounded-xl text-sm font-semibold">
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  )
}
