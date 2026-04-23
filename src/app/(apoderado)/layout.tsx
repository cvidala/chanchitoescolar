export default function ApoderadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-[#1E3A5F] text-white px-4 py-3 flex items-center gap-2">
        <span className="text-2xl">🐷</span>
        <span className="font-bold text-sm">ChanchitoEscolar</span>
      </header>
      <main className="max-w-lg mx-auto p-4">{children}</main>
    </div>
  )
}
