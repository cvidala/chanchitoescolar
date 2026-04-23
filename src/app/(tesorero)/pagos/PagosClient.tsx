'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Sparkles, X } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { MESES } from '@/constants'

interface Pago {
  id: string; monto: number; estado: string; comprobante_url?: string
  mes?: number; created_at: string; motivo_rechazo?: string
  ia_resultado?: { monto_detectado?: number; fecha_detectada?: string; cuenta_destino?: string }
  alumnos: { nombre: string; apellido: string } | null
  colectas: { nombre: string; monto_por_alumno?: number } | null
}

export default function PagosClient({ pendientes, historial }: { pendientes: Pago[]; historial: Pago[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<'pendientes' | 'historial'>('pendientes')
  const [imagen, setImagen] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  async function aprobar(id: string) {
    setLoading(id)
    await fetch(`/api/pagos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'aprobado' }) })
    setLoading(null)
    router.refresh()
  }

  async function rechazar(id: string) {
    setLoading(id)
    await fetch(`/api/pagos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'rechazado', motivo_rechazo: motivo }) })
    setLoading(null)
    setRechazando(null)
    setMotivo('')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#1E293B]">Pagos</h1>
        <p className="text-sm text-[#64748B]">{pendientes.length} comprobantes por revisar</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(['pendientes', 'historial'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B]'}`}>
            {t === 'pendientes' ? `Por revisar (${pendientes.length})` : `Historial (${historial.length})`}
          </button>
        ))}
      </div>

      {tab === 'pendientes' && (
        pendientes.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]">
            <p className="text-4xl mb-2">✅</p>
            <p className="font-medium">Sin comprobantes pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendientes.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-[#1E293B]">{p.alumnos?.apellido}, {p.alumnos?.nombre}</p>
                    <p className="text-xs text-[#64748B]">
                      {p.colectas?.nombre}{p.mes ? ` · ${MESES[p.mes]}` : ''} · {formatMoney(p.monto)}
                    </p>
                    <p className="text-xs text-[#64748B]">{new Date(p.created_at).toLocaleString('es-CL')}</p>
                  </div>
                  {p.estado === 'verificado_ia' && (
                    <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full shrink-0">
                      <Sparkles size={12} /> IA verificado
                    </span>
                  )}
                </div>

                {p.ia_resultado && (
                  <div className="bg-purple-50 rounded-lg p-2 text-xs text-purple-700 space-y-0.5">
                    {p.ia_resultado.monto_detectado && <p>Monto detectado: <strong>{formatMoney(p.ia_resultado.monto_detectado)}</strong>{p.ia_resultado.monto_detectado !== p.monto ? ' ⚠️ difiere' : ' ✓'}</p>}
                    {p.ia_resultado.fecha_detectada && <p>Fecha: {p.ia_resultado.fecha_detectada}</p>}
                    {p.ia_resultado.cuenta_destino && <p>Cuenta destino: {p.ia_resultado.cuenta_destino}</p>}
                  </div>
                )}

                {p.comprobante_url && (
                  <button onClick={() => setImagen(p.comprobante_url!)}
                    className="w-full h-24 rounded-lg overflow-hidden border border-[#E2E8F0] hover:opacity-80 transition">
                    <img src={p.comprobante_url} alt="comprobante" className="w-full h-full object-cover" />
                  </button>
                )}

                {rechazando === p.id ? (
                  <div className="space-y-2">
                    <input value={motivo} onChange={e => setMotivo(e.target.value)}
                      placeholder="Motivo del rechazo (opcional)" className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    <div className="flex gap-2">
                      <button onClick={() => setRechazando(null)} className="flex-1 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#64748B]">Cancelar</button>
                      <button onClick={() => rechazar(p.id)} disabled={loading === p.id}
                        className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold disabled:opacity-50">
                        {loading === p.id ? '...' : 'Confirmar rechazo'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setRechazando(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition">
                      <XCircle size={16} /> Rechazar
                    </button>
                    <button onClick={() => aprobar(p.id)} disabled={loading === p.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#22C55E] text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition">
                      {loading === p.id ? <Clock size={16} className="animate-spin" /> : <CheckCircle size={16} />} Aprobar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'historial' && (
        <div className="space-y-2">
          {historial.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-[#E2E8F0] p-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-sm text-[#1E293B]">{p.alumnos?.apellido}, {p.alumnos?.nombre}</p>
                <p className="text-xs text-[#64748B]">{p.colectas?.nombre}{p.mes ? ` · ${MESES[p.mes]}` : ''}</p>
                {p.motivo_rechazo && <p className="text-xs text-red-400">Motivo: {p.motivo_rechazo}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold text-sm text-[#1E293B]">{formatMoney(p.monto)}</span>
                {p.estado === 'aprobado'
                  ? <CheckCircle size={18} className="text-[#22C55E]" />
                  : <XCircle size={18} className="text-[#EF4444]" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {imagen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setImagen(null)}>
          <div className="relative max-w-lg w-full">
            <button onClick={() => setImagen(null)} className="absolute -top-10 right-0 text-white"><X size={24} /></button>
            <img src={imagen} alt="comprobante" className="w-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}
