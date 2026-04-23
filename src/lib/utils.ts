import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRut(rut: string): string {
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted}-${dv}`
}

export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function generateCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function formatTelefono(valor: string): string {
  // Elimina todo excepto dígitos
  const digits = valor.replace(/\D/g, '')

  // Si empieza con 569, 56, o 9 lo normalizamos
  let numero = digits
  if (numero.startsWith('569')) numero = numero.slice(3)
  else if (numero.startsWith('56')) numero = numero.slice(2)
  else if (numero.startsWith('9')) numero = numero.slice(1)

  // Máximo 8 dígitos (el número móvil chileno sin prefijo)
  numero = numero.slice(0, 8)

  if (numero.length === 0) return ''
  if (numero.length <= 4) return `+569 ${numero}`
  return `+569 ${numero.slice(0, 4)} ${numero.slice(4)}`
}

export function cleanTelefono(valor: string): string {
  const digits = valor.replace(/\D/g, '')
  if (digits.startsWith('569')) return `+${digits}`
  if (digits.startsWith('56')) return `+${digits}`
  if (digits.startsWith('9') && digits.length === 9) return `+56${digits}`
  if (digits.length === 8) return `+569${digits}`
  return valor
}

export function isValidTelefono(valor: string): boolean {
  const clean = valor.replace(/\D/g, '')
  // Debe tener 569 + 8 dígitos = 11 dígitos, o directo 9 + 8 = 9 dígitos
  return /^569\d{8}$/.test(clean) || /^9\d{8}$/.test(clean) || /^\d{8}$/.test(clean)
}
