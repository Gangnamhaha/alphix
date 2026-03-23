'use client'

import { useEffect } from 'react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 text-center space-y-3">
        <h1 className="text-xl font-semibold">일시적인 오류가 발생했습니다</h1>
        <p className="text-sm text-muted-foreground">
          앱을 다시 불러오거나 잠시 후 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
