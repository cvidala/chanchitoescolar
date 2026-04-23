'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRut } from '@/lib/utils'

export default function LoginForm() {
  const router = useRouter()
  const [rut, setRut] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRut(formatRut(e.target.value))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rut }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError('RUT no registrado. Contacta al tesorero de tu curso.')
      return
    }

    router.push(data.rol === 'tesorero' ? '/dashboard' : '/mi-curso')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 space-y-4">
      <div>
        <label htmlFor="rut" className="block text-sm font-medium text-[#1E293B] mb-1.5">
          RUT
        </label>
        <input
          id="rut"
          type="text"
          value={rut}
          onChange={handleRutChange}
          placeholder="12.345.678-9"
          maxLength={12}
          autoComplete="off"
          className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-[#1E293B] text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition"
        />
      </div>

      {error && (
        <p className="text-sm text-[#EF4444] bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || rut.length < 9}
        className="w-full py-3 rounded-xl bg-[#F97316] text-white font-semibold text-base hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>

      <p className="text-xs text-center text-[#64748B]">
        Solo ingresa tu RUT. El tesorero te habrá registrado previamente.
      </p>
    </form>
  )
}
