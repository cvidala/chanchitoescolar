'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Upload, Loader2, ImageIcon } from 'lucide-react'
import { formatMoney } from '@/lib/utils'
import { CATEGORIAS_GASTO } from '@/constants'

interface Gasto {
  id: string; descripcion: string; monto: number; categoria: string
  fecha: string; comercio?: string; numero_boleta?: string; boleta_url?: string
}

export default function GastosClient({ gastos }: { gastos: Gasto[] }) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    descripcion: '', monto: '', categoria: 'otros',
    fecha: new Date().toISOString().split('T')[0],
    comercio: '', numero_boleta: '', boleta_url: '',
  })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); setError('') }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/gastos/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (data.url) {
      setForm(p => ({
        ...p,
        boleta_url: data.url,
        ...(data.ocr ? {
          monto: data.ocr.monto ? String(data.ocr.monto) : p.monto,
          comercio: data.ocr.comercio ?? p.comercio,
          numero_boleta: data.ocr.numero_boleta ?? p.numero_boleta,
          fecha: data.ocr.fecha ?? p.fecha,
        } : {}),
      }))
    }
  }

  async function guardar() {
    setLoading(true); setError('')
    const res = await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monto: Number(form.monto) }),
    })
    setLoading(false)
    if (!res.ok) { setError('Error al guardar'); return }
    setModal(false)
    setForm({ descripcion: '', monto: '', categoria: 'otros', fecha: new Date().toISOString().split('T')[0], comercio: '', numero_boleta: '', boleta_url: '' })
    router.refresh()
  }

  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)

  const porCategoria = CATEGORIAS_GASTO.map(cat => ({
    ...cat,
    total: gastos.filter(g => g.categoria === cat.value).reduce((s, g) => s + g.monto, 0),
  })).filter(c => c.total > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Gastos</h1>
          <p className="text-sm text-[#64748B]">Total: {formatMoney(totalGastos)}</p>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#F97316] text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition">
          <Plus size={16} /><span className="hidden sm:inline">Nuevo gasto</span>
        </button>
      </div>

      {porCategoria.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {porCategoria.map(c => (
            <div key={c.value} className="bg-white rounded-xl border border-[#E2E8F0] p-3 text-center">
              <p className="font-bold text-sm text-[#EF4444]">{formatMoney(c.total)}</p>
              <p className="text-xs text-[#64748B]">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {gastos.length === 0 ? (
        <div className="text-center py-12 text-[#64748B]">
          <p className="text-4xl mb-2">🧾</p>
          <p className="font-medium">Sin gastos registrados</p>
          <p className="text-sm">Agrega un gasto con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-2">
          {gastos.map(g => (
            <div key={g.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-start gap-3">
              {g.boleta_url ? (
                <a href={g.boleta_url} target="_blank" rel="noopener noreferrer"
                  className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-[#E2E8F0] hover:opacity-80 transition">
                  <img src={g.boleta_url} alt="boleta" className="w-full h-full object-cover" />
                </a>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-[#E2E8F0] flex items-center justify-center shrink-0">
                  <ImageIcon size={20} className="text-[#64748B]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-[#1E293B] truncate">{g.descripcion}</p>
                  <p className="font-bold text-sm text-[#EF4444] shrink-0">{formatMoney(g.monto)}</p>
                </div>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {CATEGORIAS_GASTO.find(c => c.value === g.categoria)?.label ?? g.categoria}
                  {g.comercio && ` · ${g.comercio}`}
                  {g.numero_boleta && ` · N° ${g.numero_boleta}`}
                </p>
                <p className="text-xs text-[#64748B]">{new Date(g.fecha).toLocaleDateString('es-CL')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <h2 className="font-bold text-[#1E293B]">Registrar gasto</h2>
              <button onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <div className="p-4 space-y-3">

              {/* Upload boleta */}
              <div>
                <label className="block text-xs font-medium text-[#1E293B] mb-1">Foto de boleta (opcional — la IA extrae los datos)</label>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                {form.boleta_url ? (
                  <div className="relative">
                    <img src={form.boleta_url} alt="boleta" className="w-full h-32 object-cover rounded-xl border border-[#E2E8F0]" />
                    <button onClick={() => setForm(p => ({ ...p, boleta_url: '' }))}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"><X size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="w-full py-4 border-2 border-dashed border-[#E2E8F0] rounded-xl text-sm text-[#64748B] hover:border-[#F97316] hover:text-[#F97316] transition flex items-center justify-center gap-2">
                    {uploading ? <><Loader2 size={16} className="animate-spin" /> Analizando con IA...</> : <><Upload size={16} /> Subir foto de boleta</>}
                  </button>
                )}
              </div>

              <Field label="Descripción *">
                <input value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Ej: Desayuno profesora jefe" className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Monto ($) *">
                  <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)} placeholder="31990" className={inputClass} />
                </Field>
                <Field label="Fecha *">
                  <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label="Categoría">
                <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className={inputClass}>
                  {CATEGORIAS_GASTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Comercio">
                  <input value={form.comercio} onChange={e => set('comercio', e.target.value)} placeholder="Unimarc" className={inputClass} />
                </Field>
                <Field label="N° boleta">
                  <input value={form.numero_boleta} onChange={e => set('numero_boleta', e.target.value)} placeholder="12345" className={inputClass} />
                </Field>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button onClick={guardar} disabled={loading || !form.descripcion || !form.monto}
                className="w-full py-3 rounded-xl bg-[#F97316] text-white font-semibold disabled:opacity-50 hover:bg-orange-600 transition">
                {loading ? 'Guardando...' : 'Registrar gasto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#F97316] transition'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-[#1E293B] mb-1">{label}</label>{children}</div>
}
