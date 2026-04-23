'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Upload, Loader2, CheckCircle, Clock, XCircle, LogOut } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { MESES } from '@/constants'


interface CuentaBancaria { banco: string; tipo_cuenta: string; numero_cuenta: string; rut_titular: string; nombre_titular: string; email_notificacion?: string }
interface Colecta { id: string; nombre: string; tipo: string; fecha_limite?: string; estado: string }
interface Pago { id: string; mes?: number; monto: number; estado: string; comprobante_url?: string; motivo_rechazo?: string; colectas: Colecta | null }
interface Alumno { id: string; nombre: string; apellido: string; cursos: { nombre: string; colegio: string; cuentas_bancarias: CuentaBancaria[] } | null; pagos: Pago[] }
interface Relacion { relacion?: string; alumnos: Alumno | null }

export default function MiCursoClient({ relaciones, nombre }: { relaciones: Relacion[]; nombre: string }) {
  const router = useRouter()
  const [copiado, setCopiado] = useState(false)
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [alumnoActivo, setAlumnoActivo] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pagoParaSubir, setPagoParaSubir] = useState<string | null>(null)

  const hijos = relaciones.map(r => r.alumnos).filter(Boolean) as Alumno[]
  const alumno = hijos[alumnoActivo]

  if (!alumno) {
    return (
      <div className="text-center py-12 text-[#64748B]">
        <p className="text-4xl mb-2">🐷</p>
        <p className="font-medium">No tienes alumnos asociados</p>
        <p className="text-sm">Contacta al tesorero del curso</p>
      </div>
    )
  }

  const curso = alumno.cursos
  const cuenta = curso?.cuentas_bancarias?.[0]
  const pagos = alumno.pagos ?? []
  const pendientes = pagos.filter(p => ['pendiente', 'rechazado'].includes(p.estado))
  const enRevision = pagos.filter(p => ['comprobante_enviado', 'verificado_ia'].includes(p.estado))
  const aprobados = pagos.filter(p => p.estado === 'aprobado')

  function copiarCuenta() {
    if (!cuenta) return
    const texto = `Banco: ${cuenta.banco}\nTipo: ${formatTipoCuenta(cuenta.tipo_cuenta)}\nNúmero: ${cuenta.numero_cuenta}\nRUT: ${cuenta.rut_titular}\nNombre: ${cuenta.nombre_titular}${cuenta.email_notificacion ? `\nEmail: ${cuenta.email_notificacion}` : ''}`
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function subirComprobante(e: React.ChangeEvent<HTMLInputElement>) {
    if (!pagoParaSubir) return
    const file = e.target.files?.[0]
    if (!file) return
    setSubiendo(pagoParaSubir)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('pagoId', pagoParaSubir)
    await fetch('/api/pagos/comprobante', { method: 'POST', body: fd })
    setSubiendo(null)
    setPagoParaSubir(null)
    router.refresh()
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#64748B]">Hola,</p>
          <h1 className="text-xl font-bold text-[#1E293B]">{nombre}</h1>
        </div>
        <button onClick={logout} className="p-2 rounded-lg text-[#64748B] hover:bg-gray-100 transition"><LogOut size={18} /></button>
      </div>

      {/* Selector de hijo si tiene más de uno */}
      {hijos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {hijos.map((h, i) => (
            <button key={h.id} onClick={() => setAlumnoActivo(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${i === alumnoActivo ? 'bg-[#F97316] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B]'}`}>
              {h.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Info del alumno */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
        <p className="font-bold text-[#1E293B]">{alumno.apellido}, {alumno.nombre}</p>
        <p className="text-sm text-[#64748B]">{curso?.nombre} · {curso?.colegio}</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2">
        <ResumenCard label="Pendiente" count={pendientes.length} color="red" />
        <ResumenCard label="En revisión" count={enRevision.length} color="orange" />
        <ResumenCard label="Pagado" count={aprobados.length} color="green" />
      </div>

      {/* Pagos pendientes */}
      {pendientes.length > 0 && (
        <section>
          <h2 className="font-semibold text-[#1E293B] mb-2">Pendientes de pago</h2>
          <div className="space-y-2">
            {pendientes.map(p => (
              <div key={p.id} className={`bg-white rounded-xl border p-4 ${p.estado === 'rechazado' ? 'border-red-200' : 'border-orange-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm text-[#1E293B]">{p.colectas?.nombre}{p.mes ? ` · ${MESES[p.mes]}` : ''}</p>
                    <p className="font-bold text-[#F97316]">{formatMoney(p.monto)}</p>
                    {p.colectas?.fecha_limite && <p className="text-xs text-[#64748B]">Vence: {new Date(p.colectas.fecha_limite).toLocaleDateString('es-CL')}</p>}
                    {p.estado === 'rechazado' && p.motivo_rechazo && <p className="text-xs text-red-500">Rechazado: {p.motivo_rechazo}</p>}
                  </div>
                  <button
                    onClick={() => { setPagoParaSubir(p.id); fileRef.current?.click() }}
                    disabled={subiendo === p.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#F97316] text-white rounded-xl text-xs font-semibold hover:bg-orange-600 disabled:opacity-50 transition">
                    {subiendo === p.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {subiendo === p.id ? 'Subiendo...' : 'Subir comprobante'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Datos de transferencia */}
      {cuenta && pendientes.length > 0 && (
        <section>
          <h2 className="font-semibold text-[#1E293B] mb-2">Datos para transferencia</h2>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="space-y-1 text-sm mb-3 font-mono">
              <p><span className="text-[#64748B]">Banco:</span> {cuenta.banco}</p>
              <p><span className="text-[#64748B]">Tipo:</span> {formatTipoCuenta(cuenta.tipo_cuenta)}</p>
              <p><span className="text-[#64748B]">Número:</span> {cuenta.numero_cuenta}</p>
              <p><span className="text-[#64748B]">RUT:</span> {cuenta.rut_titular}</p>
              <p><span className="text-[#64748B]">Nombre:</span> {cuenta.nombre_titular}</p>
              {cuenta.email_notificacion && <p><span className="text-[#64748B]">Email:</span> {cuenta.email_notificacion}</p>}
            </div>
            <button onClick={copiarCuenta}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 text-[#F97316] font-medium text-sm hover:bg-orange-100 transition">
              {copiado ? <><Check size={16} /> ¡Copiado!</> : <><Copy size={16} /> Copiar datos</>}
            </button>
          </div>
        </section>
      )}

      {/* En revisión */}
      {enRevision.length > 0 && (
        <section>
          <h2 className="font-semibold text-[#1E293B] mb-2">En revisión</h2>
          <div className="space-y-2">
            {enRevision.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{p.colectas?.nombre}{p.mes ? ` · ${MESES[p.mes]}` : ''}</p>
                  <p className="text-xs text-[#64748B]">{formatMoney(p.monto)}</p>
                </div>
                <Clock size={18} className="text-[#F59E0B]" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Aprobados */}
      {aprobados.length > 0 && (
        <section>
          <h2 className="font-semibold text-[#1E293B] mb-2">Pagados</h2>
          <div className="space-y-2">
            {aprobados.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">{p.colectas?.nombre}{p.mes ? ` · ${MESES[p.mes]}` : ''}</p>
                  <p className="text-xs text-[#64748B]">{formatMoney(p.monto)}</p>
                </div>
                <CheckCircle size={18} className="text-[#22C55E]" />
              </div>
            ))}
          </div>
        </section>
      )}

      <input ref={fileRef} type="file" accept="image/*" onChange={subirComprobante} className="hidden" />
    </div>
  )
}

function ResumenCard({ label, count, color }: { label: string; count: number; color: 'red' | 'orange' | 'green' }) {
  const colors = { red: 'text-[#EF4444]', orange: 'text-[#F97316]', green: 'text-[#22C55E]' }
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 text-center">
      <p className={`text-2xl font-bold ${colors[color]}`}>{count}</p>
      <p className="text-xs text-[#64748B]">{label}</p>
    </div>
  )
}

function formatTipoCuenta(tipo: string) {
  return { corriente: 'Cuenta Corriente', vista: 'Cuenta Vista', ahorro: 'Cuenta de Ahorro' }[tipo] ?? tipo
}
