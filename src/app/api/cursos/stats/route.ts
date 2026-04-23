import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json({ error: 'Sin curso' }, { status: 400 })

  const cursoId = session.cursoId

  const [alumnos, colectas, gastos, pagos, pendientes] = await Promise.all([
    supabaseAdmin.from('alumnos').select('id', { count: 'exact' }).eq('curso_id', cursoId),
    supabaseAdmin.from('colectas').select('*').eq('curso_id', cursoId).eq('estado', 'activa'),
    supabaseAdmin.from('gastos').select('monto').eq('curso_id', cursoId),
    supabaseAdmin.from('pagos').select('monto, estado, colecta_id, alumno_id').in(
      'colecta_id',
      (await supabaseAdmin.from('colectas').select('id').eq('curso_id', cursoId)).data?.map(c => c.id) ?? []
    ),
    supabaseAdmin.from('pagos').select('id, alumno_id, colecta_id, comprobante_url, created_at, colectas(nombre), alumnos(nombre, apellido)')
      .eq('estado', 'comprobante_enviado')
      .in(
        'colecta_id',
        (await supabaseAdmin.from('colectas').select('id').eq('curso_id', cursoId)).data?.map(c => c.id) ?? []
      )
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalGastos = gastos.data?.reduce((s, g) => s + g.monto, 0) ?? 0
  const totalIngresos = pagos.data?.filter(p => p.estado === 'aprobado').reduce((s, p) => s + p.monto, 0) ?? 0
  const balance = totalIngresos - totalGastos

  return NextResponse.json({
    totalAlumnos: alumnos.count ?? 0,
    totalIngresos,
    totalGastos,
    balance,
    colectasActivas: colectas.data ?? [],
    pagosAprobados: pagos.data?.filter(p => p.estado === 'aprobado') ?? [],
    pendientesAprobacion: pendientes.data ?? [],
  })
}
