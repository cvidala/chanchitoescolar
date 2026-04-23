'use client'

import { useEffect, useRef } from 'react'

interface AdBannerProps {
  slot: string
  format?: 'auto' | 'rectangle' | 'horizontal'
  className?: string
}

declare global {
  interface Window { adsbygoogle: unknown[] }
}

export default function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID
  const pushed = useRef(false)

  useEffect(() => {
    if (!pubId || pubId.includes('XXXX') || pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {}
  }, [pubId])

  // En desarrollo o sin pub ID real, muestra un placeholder visible
  if (!pubId || pubId.includes('XXXX')) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-gray-50 text-xs text-[#94A3B8] h-16 ${className}`}>
        Publicidad · AdSense pendiente de configurar
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="text-[10px] text-[#94A3B8] text-center mb-1">Publicidad</p>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={pubId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
