import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChanchitoEscolar',
  description: 'Gestión financiera transparente para cursos escolares',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#F8FAFC] text-[#1E293B] antialiased">
        {children}
      </body>
    </html>
  )
}
