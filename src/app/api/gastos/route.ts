import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json([])

  const { data } = await supabaseAdmin
    .from('gastos')
    .select('*')
    .eq('curso_id', session.cursoId)
    .order('fecha', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json({ error: 'Sin curso' }, { status: 400 })

  const body = await req.json()
  const { descripcion, monto, categoria, fecha, comercio, numero_boleta, boleta_url } = body

  const { data, error } = await supabaseAdmin
    .from('gastos')
    .insert({
      curso_id: session.cursoId,
      descripcion,
      monto,
      categoria,
      fecha,
      comercio: comercio || null,
      numero_boleta: numero_boleta || null,
      boleta_url: boleta_url || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ gasto: data })
}
