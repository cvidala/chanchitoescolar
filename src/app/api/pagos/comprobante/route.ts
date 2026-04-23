import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const pagoId = formData.get('pagoId') as string

  if (!file || !pagoId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${session.apoderadoId}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabaseAdmin.storage
    .from('comprobantes')
    .upload(path, buffer, { contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabaseAdmin.storage.from('comprobantes').getPublicUrl(path)

  // OCR del comprobante con Claude Vision
  let iaResultado = null
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
              { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
              { type: 'text', text: 'Este es un comprobante de transferencia bancaria chilena. Extrae: monto transferido, fecha, cuenta de destino (número), nombre del destinatario. Responde SOLO con JSON: {"monto_detectado": number, "fecha_detectada": "YYYY-MM-DD", "cuenta_destino": string, "destinatario": string}. Si no puedes leer algún campo, omítelo.' },
            ],
          }],
        }),
      })
      const json = await resp.json()
      const text = json.content?.[0]?.text ?? ''
      const match = text.match(/\{[\s\S]*\}/)
      if (match) iaResultado = JSON.parse(match[0])
    } catch { /* OCR opcional */ }
  }

  const estado = iaResultado ? 'verificado_ia' : 'comprobante_enviado'

  await supabaseAdmin
    .from('pagos')
    .update({ comprobante_url: publicUrl, estado, ia_resultado: iaResultado })
    .eq('id', pagoId)

  return NextResponse.json({ url: publicUrl, iaResultado, estado })
}
