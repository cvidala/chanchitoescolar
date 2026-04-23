'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { formatRut } from '@/lib/utils'
import RegistroTesorero from './RegistroTesorero'

type Vista = 'login' | 'registro'
type Paso = 'rut' | 'password'

export default function LoginForm() {
  const router = useRouter()
  const [vista, setVista] = useState<Vista>('login')
  const [paso, setPaso] = useState<Paso>('rut')
  const [rut, setRut] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPass, setMostrarPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleRutChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRut(formatRut(e.target.value))
    setError('')
  }

  async function handleSubmitRut(e: React.FormEvent) {
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

    if (res.status === 404) {
      setError('RUT no encontrado. Contacta al tesorero de tu curso.')
      return
    }

    if (data.requierePassword) {
      setPaso('password')
      return
    }

    if (data.rol) {
      router.push(data.rol === 'tesorero' ? '/dashboard' : '/mi-curso')
    }
  }

  async function handleSubmitPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rut, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Contraseña incorrecta')
      return
    }

    router.push('/dashboard')
  }

  if (vista === 'registro') {
    return <RegistroTesorero onVolver={() => setVista('login')} />
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={paso === 'rut' ? handleSubmitRut : handleSubmitPassword}
        className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 space-y-4"
      >
        {/* Campo RUT — siempre visible */}
        <div>
          <label className="block text-sm font-medium text-[#1E293B] mb-1.5">RUT</label>
          <input
            type="text"
            value={rut}
            onChange={handleRutChange}
            placeholder="12.345.678-9"
            maxLength={12}
            autoComplete="off"
            disabled={paso === 'password'}
            className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] text-[#1E293B] text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:bg-gray-50 disabled:text-[#64748B] transition"
          />
        </div>

        {/* Campo contraseña — solo para tesorero */}
        {paso === 'password' && (
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={mostrarPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Tu contraseña"
                autoFocus
                className="w-full px-4 py-3 pr-12 rounded-xl border border-[#E2E8F0] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#F97316] transition"
              />
              <button
                type="button"
                onClick={() => setMostrarPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] transition"
              >
                {mostrarPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-[#EF4444] bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || rut.length < 9 || (paso === 'password' && !password)}
          className="w-full py-3 rounded-xl bg-[#F97316] text-white font-semibold text-base hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Ingresando...' : paso === 'rut' ? 'Continuar' : 'Ingresar'}
        </button>

        {paso === 'password' && (
          <button
            type="button"
            onClick={() => { setPaso('rut'); setPassword(''); setError('') }}
            className="w-full text-sm text-[#64748B] hover:text-[#1E293B] transition"
          >
            ← Cambiar RUT
          </button>
        )}

        {paso === 'rut' && (
          <p className="text-xs text-center text-[#64748B]">
            Apoderado: solo ingresa tu RUT · Tesorero: RUT + contraseña
          </p>
        )}
      </form>

      {/* Menú inferior */}
      <div className="text-center">
        <button
          onClick={() => setVista('registro')}
          className="text-sm text-[#F97316] hover:text-orange-600 font-medium transition"
        >
          ¿Eres tesorero? Regístrate aquí →
        </button>
      </div>
    </div>
  )
}
