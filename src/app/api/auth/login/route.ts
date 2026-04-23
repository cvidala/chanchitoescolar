import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession } from '@/lib/auth'
import { cleanRut } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { rut } = await req.json()
  if (!rut) return NextResponse.json({ error: 'RUT requerido' }, { status: 400 })

  const rutLimpio = cleanRut(rut)

  const { data: apoderado, error } = await supabaseAdmin
    .from('apoderados')
    .select('id, rut, nombre')
    .eq('rut', rutLimpio)
    .single()

  if (error || !apoderado) {
    return NextResponse.json({ error: 'RUT no encontrado' }, { status: 404 })
  }

  const { data: cursoTesorero } = await supabaseAdmin
    .from('cursos')
    .select('id')
    .eq('tesorero_id', apoderado.id)
    .maybeSingle()

  const rol = cursoTesorero ? 'tesorero' : 'apoderado'

  await createSession({
    apoderadoId: apoderado.id,
    rut: apoderado.rut,
    nombre: apoderado.nombre,
    rol,
    cursoId: cursoTesorero?.id,
  })

  return NextResponse.json({ rol })
}
