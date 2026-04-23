import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import PagosClient from './PagosClient'

export default async function PagosPage() {
  const session = await getSession()
  if (!session?.cursoId) redirect('/dashboard/nuevo-curso')

  const colectasIds = (await supabaseAdmin.from('colectas').select('id').eq('curso_id', session.cursoId)).data?.map(c => c.id) ?? []

  const [pendientes, historial] = await Promise.all([
    supabaseAdmin.from('pagos')
      .select('*, alumnos(nombre, apellido), colectas(nombre, monto_por_alumno)')
      .in('estado', ['comprobante_enviado', 'verificado_ia'])
      .in('colecta_id', colectasIds.length ? colectasIds : ['none'])
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('pagos')
      .select('*, alumnos(nombre, apellido), colectas(nombre)')
      .in('estado', ['aprobado', 'rechazado'])
      .in('colecta_id', colectasIds.length ? colectasIds : ['none'])
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return <PagosClient pendientes={pendientes.data ?? []} historial={historial.data ?? []} />
}
