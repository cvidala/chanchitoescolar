import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import ColectasClient from './ColectasClient'

export default async function ColectasPage() {
  const session = await getSession()
  if (!session?.cursoId) redirect('/dashboard/nuevo-curso')

  const [colectas, alumnos] = await Promise.all([
    supabaseAdmin.from('colectas').select('*').eq('curso_id', session.cursoId).order('created_at', { ascending: false }),
    supabaseAdmin.from('alumnos').select('id', { count: 'exact', head: true }).eq('curso_id', session.cursoId),
  ])

  const colectasIds = colectas.data?.map(c => c.id) ?? []
  const { data: pagosAprobados } = await supabaseAdmin
    .from('pagos')
    .select('colecta_id, alumno_id, mes')
    .eq('estado', 'aprobado')
    .in('colecta_id', colectasIds.length > 0 ? colectasIds : ['none'])

  return (
    <ColectasClient
      colectas={colectas.data ?? []}
      totalAlumnos={alumnos.count ?? 0}
      pagosAprobados={pagosAprobados ?? []}
    />
  )
}
