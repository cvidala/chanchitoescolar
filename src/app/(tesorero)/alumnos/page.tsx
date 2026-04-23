import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import AlumnosClient from './AlumnosClient'
import { redirect } from 'next/navigation'

export default async function AlumnosPage() {
  const session = await getSession()
  if (!session?.cursoId) redirect('/dashboard/nuevo-curso')

  const { data: alumnos } = await supabaseAdmin
    .from('alumnos')
    .select('*, alumno_apoderado(relacion, apoderados(rut, nombre, telefono))')
    .eq('curso_id', session.cursoId)
    .order('apellido')

  return <AlumnosClient alumnos={alumnos ?? []} />
}
