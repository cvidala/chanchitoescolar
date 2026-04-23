import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { estado, motivo_rechazo } = await req.json()

  const update: Record<string, unknown> = { estado }
  if (estado === 'aprobado') update.aprobado_por = session.apoderadoId
  if (estado === 'rechazado' && motivo_rechazo) update.motivo_rechazo = motivo_rechazo

  const { data, error } = await supabaseAdmin
    .from('pagos')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pago: data })
}
