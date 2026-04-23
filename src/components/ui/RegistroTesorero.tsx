'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { formatRut, formatTelefono, isValidTelefono } from '@/lib/utils'

export default function RegistroTesorero({ onVolver }: { onVolver: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mostrarPass, setMostrarPass] = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    telefono: '',
    password: '',
    confirmar: '',
  })

  const telefonoValido = form.telefono === '' || isValidTelefono(form.telefono)
  const passwordsMatch = form.password === form.confirmar
  const formValido = form.nombre && form.rut.length >= 9 && form.password.length >= 6
    && passwordsMatch && (form.telefono === '' || telefonoValido)

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formValido) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Error al registrar. Intenta de nuevo.')
      return
    }

    router.push('/dashboard/nuevo-curso')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onVolver} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-[#64748B]">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-bold text-[#1E293B]">Registro de tesorero</h2>
          <p className="text-xs text-[#64748B]">Crea tu cuenta para gestionar tu curso</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Nombre completo *">
          <input
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            placeholder="María González"
            className={inputClass}
          />
        </Field>

        <Field label="RUT *">
          <input
            value={form.rut}
            onChange={e => set('rut', formatRut(e.target.value))}
            placeholder="12.345.678-9"
            maxLength={12}
            className={inputClass}
          />
        </Field>

        <Field label="Teléfono (WhatsApp)">
          <input
            value={form.telefono}
            onChange={e => set('telefono', formatTelefono(e.target.value))}
            placeholder="+569 1234 5678"
            maxLength={15}
            className={`${inputClass} ${form.telefono && !telefonoValido ? 'border-red-400 focus:ring-red-400' : ''}`}
          />
          {form.telefono && !telefonoValido && (
            <p className="text-xs text-red-500 mt-1">Formato inválido. Ej: +569 1234 5678</p>
          )}
        </Field>

        <Field label="Contraseña * (mínimo 6 caracteres)">
          <div className="relative">
            <input
              type={mostrarPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setMostrarPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B]"
            >
              {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Field label="Confirmar contraseña *">
          <input
            type={mostrarPass ? 'text' : 'password'}
            value={form.confirmar}
            onChange={e => set('confirmar', e.target.value)}
            placeholder="••••••••"
            className={`${inputClass} ${form.confirmar && !passwordsMatch ? 'border-red-400 focus:ring-red-400' : ''}`}
          />
          {form.confirmar && !passwordsMatch && (
            <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
          )}
        </Field>

        {error && (
          <p className="text-sm text-[#EF4444] bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !formValido}
          className="w-full py-3 rounded-xl bg-[#F97316] text-white font-semibold disabled:opacity-50 hover:bg-orange-600 transition"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#1E293B] mb-1">{label}</label>
      {children}
    </div>
  )
}
