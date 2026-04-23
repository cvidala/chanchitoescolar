import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LoginForm from '@/components/ui/LoginForm'

export default async function Home() {
  const session = await getSession()
  if (session) {
    redirect(session.rol === 'tesorero' ? '/dashboard' : '/mi-curso')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🐷</div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">ChanchitoEscolar</h1>
          <p className="text-[#64748B] mt-1 text-sm">Gestión financiera para tu curso</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
