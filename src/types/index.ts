export type UserRole = 'tesorero' | 'apoderado'

export interface Apoderado {
  id: string
  rut: string
  nombre: string
  telefono?: string
  created_at: string
}

export interface Curso {
  id: string
  nombre: string
  colegio: string
  codigo_unico: string
  anio: number
  tesorero_id: string
  created_at: string
}

export interface CuentaBancaria {
  id: string
  curso_id: string
  banco: string
  tipo_cuenta: 'corriente' | 'vista' | 'ahorro'
  numero_cuenta: string
  rut_titular: string
  nombre_titular: string
  email_notificacion?: string
}

export interface Alumno {
  id: string
  curso_id: string
  nombre: string
  apellido: string
  created_at: string
}

export interface AlumnoApoderado {
  alumno_id: string
  apoderado_id: string
  relacion?: string
}

export type TipoColecta = 'mensualidad' | 'evento' | 'cuotas'
export type EstadoColecta = 'activa' | 'cerrada' | 'archivada'

export interface Colecta {
  id: string
  curso_id: string
  nombre: string
  descripcion?: string
  tipo: TipoColecta
  monto_por_alumno: number
  fecha_limite?: string
  meses_activos?: number[]
  estado: EstadoColecta
  created_at: string
}

export type EstadoPago = 'pendiente' | 'comprobante_enviado' | 'verificado_ia' | 'aprobado' | 'rechazado'

export interface Pago {
  id: string
  alumno_id: string
  colecta_id: string
  mes?: number
  monto: number
  estado: EstadoPago
  comprobante_url?: string
  ia_resultado?: {
    monto_detectado?: number
    fecha_detectada?: string
    cuenta_destino?: string
    confianza?: number
  }
  aprobado_por?: string
  motivo_rechazo?: string
  created_at: string
}

export type CategoriaGasto = 'actividades' | 'materiales' | 'celebraciones' | 'otros'

export interface Gasto {
  id: string
  curso_id: string
  descripcion: string
  monto: number
  categoria: CategoriaGasto
  fecha: string
  comercio?: string
  numero_boleta?: string
  boleta_url?: string
  created_at: string
}
