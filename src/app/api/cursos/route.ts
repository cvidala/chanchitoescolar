import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession, createSession } from '@/lib/auth'
import { generateCodigo } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.rol !== 'tesorero') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const { nombre, colegio, anio, cuotaMensual, mesesActivos } = body

  const { data: curso, error } = await supabaseAdmin
    .from('cursos')
    .insert({
      nombre,
      colegio,
      anio,
      codigo_unico: generateCodigo(),
      tesorero_id: session.apoderadoId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Crear colecta de mensualidad automáticamente
  if (cuotaMensual > 0) {
    await supabaseAdmin.from('colectas').insert({
      curso_id: curso.id,
      nombre: 'Mensualidad',
      tipo: 'mensualidad',
      monto_por_alumno: cuotaMensual,
      meses_activos: mesesActivos ?? [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      estado: 'activa',
    })
  }

  // Actualizar sesión con el cursoId
  await createSession({ ...session, cursoId: curso.id })

  return NextResponse.json({ curso })
}
