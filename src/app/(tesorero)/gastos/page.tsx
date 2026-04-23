import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import GastosClient from './GastosClient'

export default async function GastosPage() {
  const session = await getSession()
  if (!session?.cursoId) redirect('/dashboard/nuevo-curso')

  const { data: gastos } = await supabaseAdmin
    .from('gastos')
    .select('*')
    .eq('curso_id', session.cursoId)
    .order('fecha', { ascending: false })

  return <GastosClient gastos={gastos ?? []} />
}
