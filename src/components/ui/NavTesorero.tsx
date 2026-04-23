'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Wallet, Receipt, ClipboardCheck, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/alumnos', label: 'Alumnos', icon: Users },
  { href: '/colectas', label: 'Colectas', icon: Wallet },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
  { href: '/pagos', label: 'Pagos', icon: ClipboardCheck },
]

export default function NavTesorero({ nombre, curso }: { nombre: string; curso: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  return (
    <>
      {/* Header */}
      <header className="bg-[#1E3A5F] text-white px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐷</span>
          <div>
            <p className="font-bold text-sm leading-tight">ChanchitoEscolar</p>
            <p className="text-xs text-blue-200 leading-tight truncate max-w-[180px]">{curso}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-200 hidden sm:block">{nombre}</span>
          <button onClick={logout} className="p-1.5 rounded-lg hover:bg-white/10 transition">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Bottom nav (móvil) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] z-50 flex sm:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={cn(
              'flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition',
              active ? 'text-[#F97316]' : 'text-[#64748B]'
            )}>
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Side nav (escritorio) */}
      <nav className="hidden sm:flex fixed left-0 top-14 bottom-0 w-52 bg-white border-r border-[#E2E8F0] flex-col py-4 gap-1 z-40">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium transition',
              active
                ? 'bg-orange-50 text-[#F97316]'
                : 'text-[#64748B] hover:bg-gray-50'
            )}>
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
