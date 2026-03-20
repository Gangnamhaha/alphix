import Link from 'next/link'

import { ActivityTracker } from '@/components/activity/activity-tracker'
import { LogoutButton } from '@/components/auth/logout-button'
import { getMockSessionState } from '@/lib/auth/mock-session'
import { getUserRoleFromMetadata, isAdminRole } from '@/lib/auth/roles'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function MainLayout({ children }: { children: React.ReactNode }) {
  const mockSession = await getMockSessionState()
  const hasSupabaseEnv = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  let userEmail = 'guest@alphix.ai'
  let isAdmin = false
  let isAuthenticated = false

  if (mockSession.isAuthenticated) {
    isAuthenticated = true
    isAdmin = mockSession.role === 'admin'
    userEmail = mockSession.email ?? (isAdmin ? 'admin@local.alphix' : 'mock.user@local.alphix')
  } else if (hasSupabaseEnv) {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const role = getUserRoleFromMetadata(user)
    isAuthenticated = Boolean(user)
    isAdmin = isAdminRole(role)
    userEmail = user?.email ?? 'guest@alphix.ai'
  }

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
            <>
              <Link href="/admin" className="block px-3 py-2 rounded-md hover:bg-accent text-sm">
                🔧 관리자
              </Link>
              <Link
                href="/admin/users"
                className="block px-6 py-1.5 rounded-md hover:bg-accent text-xs text-muted-foreground"
              >
                사용자 관리
              </Link>
              <Link
                href="/admin/subscriptions"
                className="block px-6 py-1.5 rounded-md hover:bg-accent text-xs text-muted-foreground"
              >
                구독 관리
              </Link>
            </>
          ) : null}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        {isAuthenticated ? (
          <ActivityTracker userKey={userEmail.toLowerCase()} isAdmin={isAdmin} />
        ) : null}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Dashboard</h2>
            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex rounded-md border px-2 py-1 text-xs text-muted-foreground md:hidden"
              >
                관리자
              </Link>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground md:inline">{userEmail}</span>
            <LogoutButton userKey={isAuthenticated ? userEmail.toLowerCase() : undefined} />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
