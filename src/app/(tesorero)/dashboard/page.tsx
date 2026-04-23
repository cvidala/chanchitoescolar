import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/')

  // Sin curso → onboarding
  if (!session.cursoId) redirect('/dashboard/nuevo-curso')

  const cursoId = session.cursoId

  const [alumnos, colectas, gastos, pagosData, pendientesData, cursoData] = await Promise.all([
    supabaseAdmin.from('alumnos').select('id', { count: 'exact', head: true }).eq('curso_id', cursoId),
    supabaseAdmin.from('colectas').select('*').eq('curso_id', cursoId).eq('estado', 'activa'),
    supabaseAdmin.from('gastos').select('monto').eq('curso_id', cursoId),
    supabaseAdmin.from('pagos').select('monto, estado, colecta_id').filter('colecta_id', 'in', `(select id from colectas where curso_id = '${cursoId}')`),
    supabaseAdmin.from('pagos')
      .select('id, alumno_id, colecta_id, comprobante_url, created_at, alumnos(nombre, apellido), colectas(nombre)')
      .eq('estado', 'comprobante_enviado')
      .filter('colecta_id', 'in', `(select id from colectas where curso_id = '${cursoId}')`)
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin.from('cursos').select('codigo_unico').eq('id', cursoId).single(),
  ])

  const totalGastos = gastos.data?.reduce((s, g) => s + g.monto, 0) ?? 0
  const totalIngresos = pagosData.data?.filter(p => p.estado === 'aprobado').reduce((s, p) => s + p.monto, 0) ?? 0

  return (
    <DashboardClient
      totalAlumnos={alumnos.count ?? 0}
      totalIngresos={totalIngresos}
      totalGastos={totalGastos}
      balance={totalIngresos - totalGastos}
      colectasActivas={colectas.data ?? []}
      pagosAprobados={pagosData.data?.filter(p => p.estado === 'aprobado') ?? []}
      pendientesAprobacion={(pendientesData.data ?? []) as never}
      codigoUnico={cursoData.data?.codigo_unico ?? ''}
    />
  )
}
