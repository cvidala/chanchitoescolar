import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession } from '@/lib/auth'
import { cleanRut, cleanTelefono } from '@/lib/utils'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { nombre, rut, telefono, password } = await req.json()

  if (!nombre || !rut || !password) {
    return NextResponse.json({ error: 'Nombre, RUT y contraseña son requeridos' }, { status: 400 })
  }

  const rutLimpio = cleanRut(rut)

  const { data: existe } = await supabaseAdmin
    .from('apoderados')
    .select('id')
    .eq('rut', rutLimpio)
    .maybeSingle()

  if (existe) {
    return NextResponse.json({ error: 'Este RUT ya está registrado' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { data: apoderado, error } = await supabaseAdmin
    .from('apoderados')
    .insert({
      rut: rutLimpio,
      nombre,
      telefono: telefono ? cleanTelefono(telefono) : null,
      es_tesorero: true,
      password_hash,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await createSession({
    apoderadoId: apoderado.id,
    rut: apoderado.rut,
    nombre: apoderado.nombre,
    rol: 'tesorero',
  })

  return NextResponse.json({ ok: true })
}
