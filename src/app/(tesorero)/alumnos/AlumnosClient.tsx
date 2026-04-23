'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Search, X, Plus, Trash2 } from 'lucide-react'
import { formatRut } from '@/lib/utils'

interface Apoderado { rut: string; nombre: string; telefono?: string }
interface Alumno {
  id: string
  nombre: string
  apellido: string
  alumno_apoderado: { relacion?: string; apoderados: Apoderado }[]
}

export default function AlumnosClient({ alumnos }: { alumnos: Alumno[] }) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    apoderados: [{ nombre: '', rut: '', telefono: '', relacion: '' }],
  })

  const filtrados = alumnos.filter(a =>
    `${a.apellido} ${a.nombre}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  function addApoderado() {
    setForm(p => ({ ...p, apoderados: [...p.apoderados, { nombre: '', rut: '', telefono: '', relacion: '' }] }))
  }

  function removeApoderado(i: number) {
    setForm(p => ({ ...p, apoderados: p.apoderados.filter((_, idx) => idx !== i) }))
  }

  function updateApoderado(i: number, field: string, value: string) {
    setForm(p => {
      const aps = [...p.apoderados]
      aps[i] = { ...aps[i], [field]: field === 'rut' ? formatRut(value) : value }
      return { ...p, apoderados: aps }
    })
  }

  async function guardar() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/alumnos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (!res.ok) { setError('Error al guardar. Intenta de nuevo.'); return }
    setModal(false)
    setForm({ nombre: '', apellido: '', apoderados: [{ nombre: '', rut: '', telefono: '', relacion: '' }] })
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">Alumnos</h1>
          <p className="text-sm text-[#64748B]">{alumnos.length} alumnos registrados</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#F97316] text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar alumno..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        />
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-[#64748B]">
          <p className="text-4xl mb-2">🎒</p>
          <p className="font-medium">Sin alumnos aún</p>
          <p className="text-sm">Agrega el primer alumno con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <p className="font-semibold text-[#1E293B]">{a.apellido}, {a.nombre}</p>
              <div className="mt-1 space-y-0.5">
                {a.alumno_apoderado.map((rel, i) => (
                  <p key={i} className="text-xs text-[#64748B]">
                    {rel.relacion && <span className="capitalize">{rel.relacion}: </span>}
                    {rel.apoderados.nombre} · {rel.apoderados.rut}
                    {rel.apoderados.telefono && ` · ${rel.apoderados.telefono}`}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal agregar alumno */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <h2 className="font-bold text-[#1E293B]">Agregar alumno</h2>
              <button onClick={() => setModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre *">
                  <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="María" className={inputClass} />
                </Field>
                <Field label="Apellido *">
                  <input value={form.apellido} onChange={e => setForm(p => ({ ...p, apellido: e.target.value }))}
                    placeholder="González" className={inputClass} />
                </Field>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-[#1E293B]">Apoderados</p>
                  <button onClick={addApoderado} className="flex items-center gap-1 text-xs text-[#F97316] hover:text-orange-600">
                    <Plus size={14} /> Agregar otro
                  </button>
                </div>
                {form.apoderados.map((ap, i) => (
                  <div key={i} className="border border-[#E2E8F0] rounded-xl p-3 mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[#64748B]">Apoderado {i + 1}</p>
                      {i > 0 && (
                        <button onClick={() => removeApoderado(i)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <input value={ap.nombre} onChange={e => updateApoderado(i, 'nombre', e.target.value)}
                      placeholder="Nombre completo" className={inputClass} />
                    <input value={ap.rut} onChange={e => updateApoderado(i, 'rut', e.target.value)}
                      placeholder="RUT (12.345.678-9)" maxLength={12} className={inputClass} />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={ap.telefono} onChange={e => updateApoderado(i, 'telefono', e.target.value)}
                        placeholder="Teléfono" className={inputClass} />
                      <select value={ap.relacion} onChange={e => updateApoderado(i, 'relacion', e.target.value)}
                        className={inputClass}>
                        <option value="">Relación</option>
                        <option value="madre">Madre</option>
                        <option value="padre">Padre</option>
                        <option value="tutor">Tutor/a</option>
                        <option value="abuelo">Abuelo/a</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button
                onClick={guardar}
                disabled={loading || !form.nombre || !form.apellido}
                className="w-full py-3 rounded-xl bg-[#F97316] text-white font-semibold disabled:opacity-50 hover:bg-orange-600 transition"
              >
                {loading ? 'Guardando...' : 'Guardar alumno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#F97316]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#1E293B] mb-1">{label}</label>
      {children}
    </div>
  )
}
