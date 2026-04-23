import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.rol !== 'apoderado') return NextResponse.json(null, { status: 401 })

  // Hijos del apoderado con sus pagos y colectas
  const { data: relaciones } = await supabaseAdmin
    .from('alumno_apoderado')
    .select(`
      relacion,
      alumnos (
        id, nombre, apellido,
        cursos (
          id, nombre, colegio, codigo_unico,
          cuentas_bancarias (banco, tipo_cuenta, numero_cuenta, rut_titular, nombre_titular, email_notificacion)
        ),
        pagos (
          id, mes, monto, estado, comprobante_url, motivo_rechazo,
          colectas (id, nombre, tipo, fecha_limite)
        )
      )
    `)
    .eq('apoderado_id', session.apoderadoId)

  return NextResponse.json(relaciones ?? [])
}
