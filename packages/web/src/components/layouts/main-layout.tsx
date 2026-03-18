import Link from 'next/link'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const role = user?.app_metadata?.role ?? user?.user_metadata?.role
  const isAdmin = role === 'admin'

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-60 border-r bg-card hidden md:flex flex-col">
        <div className="p-4 font-bold text-xl border-b">📈 Alphix</div>
        <nav className="flex-1 p-2 space-y-1">
          <Link href="/dashboard" className="block px-3 py-2 rounded-md hover:bg-accent text-sm">
            🏠 대시보드
          </Link>
          <Link href="/strategies" className="block px-3 py-2 rounded-md hover:bg-accent text-sm">
            📊 전략
          </Link>
          <Link href="/backtest" className="block px-3 py-2 rounded-md hover:bg-accent text-sm">
            🧪 백테스트
          </Link>
          <Link href="/portfolio" className="block px-3 py-2 rounded-md hover:bg-accent text-sm">
            💼 포트폴리오
          </Link>
          <Link href="/monitoring" className="block px-3 py-2 rounded-md hover:bg-accent text-sm">
            📡 모니터링
          </Link>
          <Link href="/settings" className="block px-3 py-2 rounded-md hover:bg-accent text-sm">
            ⚙️ 설정
          </Link>
          {isAdmin ? (
            <Link href="/admin" className="block px-3 py-2 rounded-md hover:bg-accent text-sm">
              🔧 관리자
            </Link>
          ) : null}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
          <h2 className="font-semibold">Dashboard</h2>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
