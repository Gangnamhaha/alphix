export function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b flex items-center justify-between px-6 max-w-7xl mx-auto">
        <span className="font-bold text-xl">📈 Alphix</span>
        <div className="space-x-4">
          <a href="/login" className="text-sm hover:underline">로그인</a>
          <a href="/signup" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md">시작하기</a>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
