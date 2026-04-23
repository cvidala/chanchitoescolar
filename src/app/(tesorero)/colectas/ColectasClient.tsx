'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, ChevronDown, ChevronUp, CheckCircle, Clock, Archive } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { MESES, CATEGORIAS_GASTO } from '@/constants'

const MESES_ESCOLARES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

interface Colecta {
  id: string; nombre: string; tipo: string; monto_por_alumno: number
  fecha_limite?: string; meses_activos?: number[]; estado: string; descripcion?: string
}

interface Props {
  colectas: Colecta[]
  totalAlumnos: number
  pagosAprobados: { colecta_id: string; alumno_id: string; mes?: number }[]
}

export default function ColectasClient({ colectas, totalAlumnos, pagosAprobados }: Props) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandida, setExpandida] = useState<string | null>(null)

  const [form, setForm] = useState({
    nombre: '', descripcion: '', tipo: 'evento',
    monto_por_alumno: '', fecha_limite: '',
    meses_activos: MESES_ESCOLARES,
  })

  function set(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })); setError('') }

  async function guardar() {
    setLoading(true); setError('')
    const res = await fetch('/api/colectas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monto_por_alumno: Number(form.monto_por_alumno) }),
    })
    setLoading(false)
    if (!res.ok) { setError('Error al guardar'); return }
    setModal(false)
    setForm({ nombre: '', descripcion: '', tipo: 'evento', monto_por_alumno: '', fecha_limite: '', meses_activos: MESES_ESCOLARES })
    router.refresh()
  }

  async function cambiarEstado(id: string, estado: string) {
    await fetch(`/api/colectas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    router.refresh()
  }

  const activas = colectas.filter(c => c.estado === 'activa')
  const cerradas = colectas.filter(c => c.estado !== 'activa')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Colectas</h1>
          <p className="text-sm text-[#64748B]">{activas.length} activas · {cerradas.length} cerradas</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#F97316] text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition">
          <Plus size={16} /><span className="hidden sm:inline">Nueva colecta</span>
        </button>
      </div>

      {colectas.length === 0 ? (
        <div className="text-center py-12 text-[#64748B]">
          <p className="text-4xl mb-2">💰</p>
          <p className="font-medium">Sin colectas aún</p>
          <p className="text-sm">La mensualidad se crea al configurar el curso</p>
        </div>
      ) : (
        <div className="space-y-2">
          {colectas.map(c => {
            const aprobados = pagosAprobados.filter(p => p.colecta_id === c.id)
            const meta = c.tipo === 'mensualidad'
              ? totalAlumnos * (c.meses_activos?.length ?? 10) * c.monto_por_alumno
              : totalAlumnos * c.monto_por_alumno
            const recaudado = aprobados.length * c.monto_por_alumno
            const pct = meta > 0 ? Math.min(100, Math.round(recaudado / meta * 100)) : 0
            const abierta = expandida === c.id

            return (
              <div key={c.id} className={`bg-white rounded-xl border ${c.estado === 'activa' ? 'border-[#E2E8F0]' : 'border-gray-100 opacity-70'}`}>
                <button className="w-full p-4 text-left flex items-center justify-between" onClick={() => setExpandida(abierta ? null : c.id)}>
                  <div className="flex items-center gap-3">
                    <EstadoBadge estado={c.estado} />
                    <div>
                      <p className="font-semibold text-sm text-[#1E293B]">{c.nombre}</p>
                      <p className="text-xs text-[#64748B]">{formatMoney(c.monto_por_alumno)} · {pct}% recaudado</p>
                    </div>
                  </div>
                  {abierta ? <ChevronUp size={16} className="text-[#64748B]" /> : <ChevronDown size={16} className="text-[#64748B]" />}
                </button>

                {abierta && (
                  <div className="px-4 pb-4 space-y-3 border-t border-[#E2E8F0] pt-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-[#F97316] h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <Stat label="Recaudado" value={formatMoney(recaudado)} color="green" />
                      <Stat label="Meta" value={formatMoney(meta)} color="blue" />
                      <Stat label="Faltante" value={formatMoney(Math.max(0, meta - recaudado))} color="red" />
                    </div>
                    {c.descripcion && <p className="text-xs text-[#64748B]">{c.descripcion}</p>}
                    {c.fecha_limite && <p className="text-xs text-[#64748B]">Vence: {new Date(c.fecha_limite).toLocaleDateString('es-CL')}</p>}
                    {c.tipo === 'mensualidad' && c.meses_activos && (
                      <div className="flex flex-wrap gap-1">
                        {c.meses_activos.map(m => <span key={m} className="text-xs bg-orange-50 text-[#F97316] px-2 py-0.5 rounded-full">{MESES[m]}</span>)}
                      </div>
                    )}
                    {c.estado === 'activa' && (
                      <button onClick={() => cambiarEstado(c.id, 'cerrada')}
                        className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#1E293B] transition">
                        <Archive size={14} /> Cerrar colecta
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <h2 className="font-bold text-[#1E293B]">Nueva colecta</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">
              <Field label="Nombre *">
                <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Convivencia fin de año" className={inputClass} />
              </Field>
              <Field label="Descripción">
                <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Opcional" className={inputClass} />
              </Field>
              <Field label="Tipo *">
                <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={inputClass}>
                  <option value="evento">Evento único</option>
                  <option value="cuotas">En cuotas</option>
                  <option value="mensualidad">Mensualidad adicional</option>
                </select>
              </Field>
              <Field label="Monto por alumno ($) *">
                <input type="number" value={form.monto_por_alumno} onChange={e => set('monto_por_alumno', e.target.value)} placeholder="5000" className={inputClass} />
              </Field>
              <Field label="Fecha límite">
                <input type="date" value={form.fecha_limite} onChange={e => set('fecha_limite', e.target.value)} className={inputClass} />
              </Field>
              {form.tipo === 'mensualidad' && (
                <Field label="Meses de cobro">
                  <div className="flex flex-wrap gap-2">
                    {MESES_ESCOLARES.map(m => (
                      <button key={m} type="button"
                        onClick={() => set('meses_activos', form.meses_activos.includes(m) ? form.meses_activos.filter(x => x !== m) : [...form.meses_activos, m].sort((a,b) => a-b))}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${form.meses_activos.includes(m) ? 'bg-[#F97316] text-white' : 'bg-gray-100 text-[#64748B]'}`}>
                        {MESES[m]}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button onClick={guardar} disabled={loading || !form.nombre || !form.monto_por_alumno}
                className="w-full py-3 rounded-xl bg-[#F97316] text-white font-semibold disabled:opacity-50 hover:bg-orange-600 transition">
                {loading ? 'Guardando...' : 'Crear colecta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === 'activa') return <CheckCircle size={18} className="text-[#22C55E] shrink-0" />
  if (estado === 'cerrada') return <Clock size={18} className="text-[#64748B] shrink-0" />
  return <Archive size={18} className="text-[#64748B] shrink-0" />
}

function Stat({ label, value, color }: { label: string; value: string; color: 'green' | 'red' | 'blue' }) {
  const colors = { green: 'text-[#22C55E]', red: 'text-[#EF4444]', blue: 'text-[#1E3A5F]' }
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <p className={`font-bold text-sm ${colors[color]}`}>{value}</p>
      <p className="text-xs text-[#64748B]">{label}</p>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#F97316] transition'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-[#1E293B] mb-1">{label}</label>{children}</div>
}

// Evitar warning de import no usado
void CATEGORIAS_GASTO
