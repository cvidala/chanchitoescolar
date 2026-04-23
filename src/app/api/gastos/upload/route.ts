import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.cursoId) return NextResponse.json({ error: 'Sin curso' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${session.cursoId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage
    .from('boletas')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage.from('boletas').getPublicUrl(path)

  // OCR con Claude Vision si hay API key configurada
  let ocrData = null
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const base64 = buffer.toString('base64')
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 256,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: file.type, data: base64 },
              },
              {
                type: 'text',
                text: 'Extrae de esta boleta o factura chilena: monto total, nombre del comercio, número de boleta/folio y fecha. Responde SOLO con JSON: {"monto": number, "comercio": string, "numero_boleta": string, "fecha": "YYYY-MM-DD"}. Si no puedes leer algún campo, omítelo.',
              },
            ],
          }],
        }),
      })
      const json = await resp.json()
      const text = json.content?.[0]?.text ?? ''
      const match = text.match(/\{[\s\S]*\}/)
      if (match) ocrData = JSON.parse(match[0])
    } catch {
      // OCR opcional, no bloquea el flujo
    }
  }

  return NextResponse.json({ url: publicUrl, ocr: ocrData })
}
