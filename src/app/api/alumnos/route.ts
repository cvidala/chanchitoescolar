import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { cleanRut } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json([], { status: 200 })

  const { data } = await supabaseAdmin
    .from('alumnos')
    .select('*, alumno_apoderado(apoderado_id, relacion, apoderados(rut, nombre, telefono))')
    .eq('curso_id', session.cursoId)
    .order('apellido')

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json({ error: 'Sin curso' }, { status: 400 })

  const body = await req.json()
  const { nombre, apellido, apoderados } = body

  const { data: alumno, error } = await supabaseAdmin
    .from('alumnos')
    .insert({ curso_id: session.cursoId, nombre, apellido })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Registrar apoderados
  for (const ap of apoderados ?? []) {
    const rutLimpio = cleanRut(ap.rut)

    let { data: apoderado } = await supabaseAdmin
      .from('apoderados')
      .select('id')
      .eq('rut', rutLimpio)
      .maybeSingle()

    if (!apoderado) {
      const { data: nuevo } = await supabaseAdmin
        .from('apoderados')
        .insert({ rut: rutLimpio, nombre: ap.nombre, telefono: ap.telefono })
        .select()
        .single()
      apoderado = nuevo
    }

    if (apoderado) {
      await supabaseAdmin.from('alumno_apoderado').upsert({
        alumno_id: alumno.id,
        apoderado_id: apoderado.id,
        relacion: ap.relacion,
      })
    }
  }

  // Crear pagos pendientes para colectas activas
  const { data: colectas } = await supabaseAdmin
    .from('colectas')
    .select('id, tipo, monto_por_alumno, meses_activos')
    .eq('curso_id', session.cursoId)
    .eq('estado', 'activa')

  const pagos = []
  for (const colecta of colectas ?? []) {
    if (colecta.tipo === 'mensualidad' && colecta.meses_activos) {
      for (const mes of colecta.meses_activos) {
        pagos.push({ alumno_id: alumno.id, colecta_id: colecta.id, mes, monto: colecta.monto_por_alumno, estado: 'pendiente' })
      }
    } else {
      pagos.push({ alumno_id: alumno.id, colecta_id: colecta.id, monto: colecta.monto_por_alumno, estado: 'pendiente' })
    }
  }

  if (pagos.length > 0) {
    await supabaseAdmin.from('pagos').insert(pagos)
  }

  return NextResponse.json({ alumno })
}
