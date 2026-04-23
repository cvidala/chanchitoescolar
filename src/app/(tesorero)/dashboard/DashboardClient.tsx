'use client'

import { formatMoney } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, Users, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import AdBanner from '@/components/ui/AdBanner'

interface Colecta {
  id: string
  nombre: string
  tipo: string
  monto_por_alumno: number
  meses_activos?: number[]
}

interface PagosPendiente {
  id: string
  alumno_id: string
  colecta_id: string
  comprobante_url?: string
  created_at: string
  alumnos: { nombre: string; apellido: string } | null
  colectas: { nombre: string } | null
}

interface Props {
  totalAlumnos: number
  totalIngresos: number
  totalGastos: number
  balance: number
  colectasActivas: Colecta[]
  pagosAprobados: { monto: number; colecta_id: string }[]
  pendientesAprobacion: PagosPendiente[]
  codigoUnico: string
}

export default function DashboardClient({
  totalAlumnos,
  totalIngresos,
  totalGastos,
  balance,
  colectasActivas,
  pagosAprobados,
  pendientesAprobacion,
  codigoUnico,
}: Props) {
  const [copiado, setCopiado] = useState(false)

  function copiarCodigo() {
    navigator.clipboard.writeText(codigoUnico)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1E293B]">Resumen del curso</h1>
        <p className="text-sm text-[#64748B]">Vista general de ingresos y gastos</p>
      </div>

      {/* Tarjetas de stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Balance actual"
          value={formatMoney(balance)}
          icon={<Wallet size={20} />}
          color={balance >= 0 ? 'green' : 'red'}
          big
        />
        <StatCard
          label="Alumnos"
          value={String(totalAlumnos)}
          icon={<Users size={20} />}
          color="blue"
        />
        <StatCard
          label="Total ingresos"
          value={formatMoney(totalIngresos)}
          icon={<TrendingUp size={20} />}
          color="green"
        />
        <StatCard
          label="Total gastos"
          value={formatMoney(totalGastos)}
          icon={<TrendingDown size={20} />}
          color="red"
        />
      </div>

      <AdBanner slot="1234567890" />

      {/* Pendientes de aprobación */}
      {pendientesAprobacion.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold text-[#1E293B]">Comprobantes por revisar</h2>
            <span className="bg-[#F97316] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendientesAprobacion.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendientesAprobacion.map(p => (
              <PendienteCard key={p.id} pago={p} />
            ))}
          </div>
        </section>
      )}

      {/* Colectas activas */}
      <section>
        <h2 className="font-semibold text-[#1E293B] mb-3">Colectas activas</h2>
        {colectasActivas.length === 0 ? (
          <p className="text-sm text-[#64748B] bg-white rounded-xl border border-[#E2E8F0] p-4">
            No hay colectas activas. Crea una en la sección Colectas.
          </p>
        ) : (
          <div className="space-y-2">
            {colectasActivas.map(c => {
              const recaudado = pagosAprobados
                .filter(p => p.colecta_id === c.id)
                .reduce((s, p) => s + p.monto, 0)
              const meta = c.monto_por_alumno * totalAlumnos * (c.meses_activos?.length ?? 1)
              const pct = meta > 0 ? Math.min(100, Math.round((recaudado / meta) * 100)) : 0
              return (
                <ColectaCard key={c.id} nombre={c.nombre} recaudado={recaudado} meta={meta} pct={pct} />
              )
            })}
          </div>
        )}
      </section>

      {/* Código del curso */}
      <section>
        <h2 className="font-semibold text-[#1E293B] mb-3">Código del curso</h2>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#64748B] mb-1">Comparte este código con los apoderados</p>
            <p className="text-2xl font-bold tracking-widest text-[#1E3A5F]">{codigoUnico}</p>
          </div>
          <button
            onClick={copiarCodigo}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-[#F97316] text-sm font-medium hover:bg-orange-100 transition"
          >
            {copiado ? <Check size={16} /> : <Copy size={16} />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, icon, color, big }: {
  label: string
  value: string
  icon: React.ReactNode
  color: 'green' | 'red' | 'blue'
  big?: boolean
}) {
  const colors = {
    green: 'text-[#22C55E] bg-green-50',
    red: 'text-[#EF4444] bg-red-50',
    blue: 'text-[#1E3A5F] bg-blue-50',
  }
  return (
    <div className={`bg-white rounded-xl border border-[#E2E8F0] p-4 ${big ? 'col-span-2' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#64748B]">{label}</span>
        <span className={`p-1.5 rounded-lg ${colors[color]}`}>{icon}</span>
      </div>
      <p className={`font-bold ${big ? 'text-2xl' : 'text-lg'} text-[#1E293B]`}>{value}</p>
    </div>
  )
}

function ColectaCard({ nombre, recaudado, meta, pct }: {
  nombre: string
  recaudado: number
  meta: number
  pct: number
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-sm text-[#1E293B]">{nombre}</span>
        <span className="text-sm font-bold text-[#F97316]">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-1.5">
        <div
          className="bg-[#F97316] h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-[#64748B]">
        <span>{formatMoney(recaudado)} recaudado</span>
        <span>Meta: {formatMoney(meta)}</span>
      </div>
    </div>
  )
}

function PendienteCard({ pago }: { pago: PagosPendiente }) {
  const alumno = pago.alumnos
  const colecta = pago.colectas
  const fecha = new Date(pago.created_at).toLocaleDateString('es-CL')

  return (
    <a href={`/pagos?id=${pago.id}`} className="block bg-white rounded-xl border border-orange-200 p-4 hover:border-orange-400 transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm text-[#1E293B]">
            {alumno?.apellido}, {alumno?.nombre}
          </p>
          <p className="text-xs text-[#64748B]">{colecta?.nombre} · {fecha}</p>
        </div>
        <span className="text-xs bg-orange-100 text-[#F97316] font-medium px-2 py-1 rounded-full">
          Revisar →
        </span>
      </div>
    </a>
  )
}
