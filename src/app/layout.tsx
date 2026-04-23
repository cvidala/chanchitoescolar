import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChanchitoEscolar',
  description: 'Gestión financiera transparente para cursos escolares',
}

const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#F8FAFC] text-[#1E293B] antialiased">
        {children}
        {pubId && !pubId.includes('XXXX') && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`}
            crossOrigin="anonymous"
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  )
}
