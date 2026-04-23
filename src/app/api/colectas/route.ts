import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json([])

  const { data } = await supabaseAdmin
    .from('colectas')
    .select('*')
    .eq('curso_id', session.cursoId)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json({ error: 'Sin curso' }, { status: 400 })

  const body = await req.json()
  const { nombre, descripcion, tipo, monto_por_alumno, fecha_limite, meses_activos } = body

  const { data: colecta, error } = await supabaseAdmin
    .from('colectas')
    .insert({
      curso_id: session.cursoId,
      nombre,
      descripcion: descripcion || null,
      tipo,
      monto_por_alumno,
      fecha_limite: fecha_limite || null,
      meses_activos: tipo === 'mensualidad' ? meses_activos : null,
      estado: 'activa',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Crear pagos pendientes para todos los alumnos del curso
  const { data: alumnos } = await supabaseAdmin
    .from('alumnos')
    .select('id')
    .eq('curso_id', session.cursoId)

  if (alumnos && alumnos.length > 0) {
    const pagos = []
    for (const alumno of alumnos) {
      if (tipo === 'mensualidad' && meses_activos) {
        for (const mes of meses_activos) {
          pagos.push({ alumno_id: alumno.id, colecta_id: colecta.id, mes, monto: monto_por_alumno, estado: 'pendiente' })
        }
      } else {
        pagos.push({ alumno_id: alumno.id, colecta_id: colecta.id, monto: monto_por_alumno, estado: 'pendiente' })
      }
    }
    await supabaseAdmin.from('pagos').insert(pagos)
  }

  return NextResponse.json({ colecta })
}
