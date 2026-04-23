import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import NavTesorero from '@/components/ui/NavTesorero'

export default async function TesoreroLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.rol !== 'tesorero') redirect('/')

  let cursoNombre = 'Sin curso'
  if (session.cursoId) {
    const { data } = await supabaseAdmin
      .from('cursos')
      .select('nombre, colegio')
      .eq('id', session.cursoId)
      .single()
    if (data) cursoNombre = `${data.nombre} — ${data.colegio}`
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <NavTesorero nombre={session.nombre} curso={cursoNombre} />
      <main className="pt-14 pb-20 sm:pb-4 sm:pl-52">
        <div className="max-w-4xl mx-auto p-4">
          {children}
        </div>
      </main>
    </div>
  )
}
