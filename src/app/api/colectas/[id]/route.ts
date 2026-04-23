import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json({ error: 'Sin curso' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const { data, error } = await supabaseAdmin
    .from('colectas')
    .update(body)
    .eq('id', id)
    .eq('curso_id', session.cursoId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ colecta: data })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json(null, { status: 401 })

  const { id } = await params

  const { data: colecta } = await supabaseAdmin
    .from('colectas')
    .select('*')
    .eq('id', id)
    .eq('curso_id', session.cursoId)
    .single()

  const { data: pagos } = await supabaseAdmin
    .from('pagos')
    .select('*, alumnos(nombre, apellido)')
    .eq('colecta_id', id)
    .order('estado')

  return NextResponse.json({ colecta, pagos: pagos ?? [] })
}
