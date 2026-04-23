'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MESES, BANCOS_CHILE } from '@/constants'
import { formatRut } from '@/lib/utils'

const MESES_ESCOLARES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export default function NuevoCursoPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [curso, setCurso] = useState({
    nombre: '',
    colegio: '',
    anio: new Date().getFullYear(),
    cuotaMensual: '',
    mesesActivos: MESES_ESCOLARES,
  })

  const [cuenta, setCuenta] = useState<{
    banco: string
    tipo_cuenta: 'corriente' | 'vista' | 'ahorro'
    numero_cuenta: string
    rut_titular: string
    nombre_titular: string
    email_notificacion: string
  }>({
    banco: '',
    tipo_cuenta: 'vista',
    numero_cuenta: '',
    rut_titular: '',
    nombre_titular: '',
    email_notificacion: '',
  })

  async function crearCurso() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...curso,
          cuotaMensual: Number(curso.cuotaMensual) || 0,
        }),
      })
      if (!res.ok) throw new Error('Error creando curso')
      const { curso: nuevoCurso } = await res.json()

      if (cuenta.banco) {
        await fetch('/api/cursos/cuenta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cursoId: nuevoCurso.id, ...cuenta }),
        })
      }

      router.push('/alumnos')
    } catch {
      setError('Hubo un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-2">🐷</div>
        <h1 className="text-xl font-bold text-[#1E3A5F]">¡Bienvenido, tesorero!</h1>
        <p className="text-sm text-[#64748B] mt-1">Configura tu curso en 2 pasos</p>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
              step >= s ? 'bg-[#F97316] text-white' : 'bg-gray-100 text-[#64748B]'
            }`}>{s}</div>
            <span className={`text-xs ${step >= s ? 'text-[#F97316]' : 'text-[#64748B]'}`}>
              {s === 1 ? 'Datos del curso' : 'Cuenta bancaria'}
            </span>
            {s < 2 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-[#F97316]' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
          <Field label="Nombre del curso" required>
            <input
              value={curso.nombre}
              onChange={e => setCurso(p => ({ ...p, nombre: e.target.value }))}
              placeholder="2° Básico A"
              className={inputClass}
            />
          </Field>
          <Field label="Colegio / Escuela" required>
            <input
              value={curso.colegio}
              onChange={e => setCurso(p => ({ ...p, colegio: e.target.value }))}
              placeholder="Escuela Los Trigales"
              className={inputClass}
            />
          </Field>
          <Field label="Año">
            <input
              type="number"
              value={curso.anio}
              onChange={e => setCurso(p => ({ ...p, anio: Number(e.target.value) }))}
              className={inputClass}
            />
          </Field>
          <Field label="Cuota mensual ($)">
            <input
              type="number"
              value={curso.cuotaMensual}
              onChange={e => setCurso(p => ({ ...p, cuotaMensual: e.target.value }))}
              placeholder="3000"
              className={inputClass}
            />
          </Field>
          <Field label="Meses de cobro">
            <div className="flex flex-wrap gap-2">
              {MESES_ESCOLARES.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCurso(p => ({
                    ...p,
                    mesesActivos: p.mesesActivos.includes(m)
                      ? p.mesesActivos.filter(x => x !== m)
                      : [...p.mesesActivos, m].sort((a, b) => a - b),
                  }))}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    curso.mesesActivos.includes(m)
                      ? 'bg-[#F97316] text-white'
                      : 'bg-gray-100 text-[#64748B]'
                  }`}
                >
                  {MESES[m]}
                </button>
              ))}
            </div>
          </Field>
          <button
            onClick={() => setStep(2)}
            disabled={!curso.nombre || !curso.colegio}
            className="w-full py-3 rounded-xl bg-[#F97316] text-white font-semibold disabled:opacity-50 transition hover:bg-orange-600"
          >
            Siguiente →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 space-y-4">
          <p className="text-sm text-[#64748B]">Los apoderados verán estos datos para hacer transferencias.</p>

          <Field label="Banco">
            <select
              value={cuenta.banco}
              onChange={e => setCuenta(p => ({ ...p, banco: e.target.value }))}
              className={inputClass}
            >
              <option value="">Selecciona banco</option>
              {BANCOS_CHILE.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Tipo de cuenta">
            <select
              value={cuenta.tipo_cuenta}
              onChange={e => setCuenta(p => ({ ...p, tipo_cuenta: e.target.value as 'corriente' | 'vista' | 'ahorro' }) as typeof p)}
              className={inputClass}
            >
              <option value="vista">Cuenta Vista</option>
              <option value="corriente">Cuenta Corriente</option>
              <option value="ahorro">Cuenta de Ahorro</option>
            </select>
          </Field>
          <Field label="Número de cuenta">
            <input
              value={cuenta.numero_cuenta}
              onChange={e => setCuenta(p => ({ ...p, numero_cuenta: e.target.value }))}
              placeholder="12345678"
              className={inputClass}
            />
          </Field>
          <Field label="RUT del titular">
            <input
              value={cuenta.rut_titular}
              onChange={e => setCuenta(p => ({ ...p, rut_titular: formatRut(e.target.value) }))}
              placeholder="12.345.678-9"
              maxLength={12}
              className={inputClass}
            />
          </Field>
          <Field label="Nombre del titular">
            <input
              value={cuenta.nombre_titular}
              onChange={e => setCuenta(p => ({ ...p, nombre_titular: e.target.value }))}
              placeholder="María González"
              className={inputClass}
            />
          </Field>
          <Field label="Email para notificación (opcional)">
            <input
              type="email"
              value={cuenta.email_notificacion}
              onChange={e => setCuenta(p => ({ ...p, email_notificacion: e.target.value }))}
              placeholder="tesorero@gmail.com"
              className={inputClass}
            />
          </Field>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl border border-[#E2E8F0] text-[#64748B] font-medium hover:bg-gray-50 transition"
            >
              ← Atrás
            </button>
            <button
              onClick={crearCurso}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#F97316] text-white font-semibold disabled:opacity-50 transition hover:bg-orange-600"
            >
              {loading ? 'Creando...' : '¡Crear curso!'}
            </button>
          </div>
          <button
            onClick={crearCurso}
            disabled={loading}
            className="w-full py-2 text-sm text-[#64748B] hover:text-[#1E293B] transition"
          >
            Omitir datos bancarios por ahora
          </button>
        </div>
      )}
    </div>
  )
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition text-sm'

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}
