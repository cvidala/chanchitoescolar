import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

const PUBLIC = ['/', '/api/auth/login', '/api/auth/logout']
const TESORERO_ONLY = ['/dashboard', '/alumnos', '/colectas', '/gastos', '/pagos']
const APODERADO_ONLY = ['/mi-curso']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC.some(p => pathname === p) || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  const token = req.cookies.get('chanchito_session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  try {
    const { payload } = await jwtVerify(token, SECRET)
    const rol = payload.rol as string

    const isTesoreroRoute = TESORERO_ONLY.some(p => pathname.startsWith(p))
    const isApoderadoRoute = APODERADO_ONLY.some(p => pathname.startsWith(p))

    if (isTesoreroRoute && rol !== 'tesorero') {
      return NextResponse.redirect(new URL('/mi-curso', req.url))
    }

    if (isApoderadoRoute && rol !== 'apoderado') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/', req.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
