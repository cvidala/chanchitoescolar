import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { cleanRut } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json({ error: 'Sin curso' }, { status: 400 })

  const { banco, tipo_cuenta, numero_cuenta, rut_titular, nombre_titular, email_notificacion } = await req.json()

  await supabaseAdmin.from('cuentas_bancarias').delete().eq('curso_id', session.cursoId)

  const { data, error } = await supabaseAdmin.from('cuentas_bancarias').insert({
    curso_id: session.cursoId,
    banco,
    tipo_cuenta,
    numero_cuenta,
    rut_titular: cleanRut(rut_titular),
    nombre_titular,
    email_notificacion: email_notificacion || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cuenta: data })
}

export async function GET() {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json(null)

  const { data } = await supabaseAdmin
    .from('cuentas_bancarias')
    .select('*')
    .eq('curso_id', session.cursoId)
    .maybeSingle()

  return NextResponse.json(data)
}
