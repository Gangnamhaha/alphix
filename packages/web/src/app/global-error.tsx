'use client'

import { useEffect } from 'react'

interface GlobalErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error('Global app error:', error)
  }, [error])

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card p-6 text-center space-y-3">
            <h1 className="text-xl font-semibold">앱 로딩 중 오류가 발생했습니다</h1>
            <p className="text-sm text-muted-foreground">
              새로고침 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              앱 다시 불러오기
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
