import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession } from '@/lib/auth'
import { cleanRut } from '@/lib/utils'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { rut, password } = await req.json()
  if (!rut) return NextResponse.json({ error: 'RUT requerido' }, { status: 400 })

  const rutLimpio = cleanRut(rut)

  const { data: apoderado, error } = await supabaseAdmin
    .from('apoderados')
    .select('id, rut, nombre, es_tesorero, password_hash')
    .eq('rut', rutLimpio)
    .single()

  if (error || !apoderado) {
    return NextResponse.json({ error: 'RUT no encontrado' }, { status: 404 })
  }

  // Tesorero requiere contraseña
  if (apoderado.es_tesorero) {
    if (!password) {
      return NextResponse.json({ requierePassword: true }, { status: 200 })
    }
    if (!apoderado.password_hash) {
      return NextResponse.json({ error: 'Cuenta sin contraseña configurada' }, { status: 401 })
    }
    const ok = await bcrypt.compare(password, apoderado.password_hash)
    if (!ok) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }
  }

  const { data: cursoTesorero } = await supabaseAdmin
    .from('cursos')
    .select('id')
    .eq('tesorero_id', apoderado.id)
    .maybeSingle()

  const rol = apoderado.es_tesorero ? 'tesorero' : 'apoderado'

  await createSession({
    apoderadoId: apoderado.id,
    rut: apoderado.rut,
    nombre: apoderado.nombre,
    rol,
    cursoId: cursoTesorero?.id,
  })

  return NextResponse.json({ rol })
}
