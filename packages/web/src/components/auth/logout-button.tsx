'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface LogoutButtonProps {
  userKey?: string
}

function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function LogoutButton({ userKey }: LogoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })

      if (!response.ok) {
        setError('서버 로그아웃에 실패했습니다. 다시 시도해 주세요.')
        return
      }

      if (hasPublicSupabaseEnv()) {
        const supabase = createClient()
        await supabase.auth.signOut()
      }

      if (userKey) {
        await fetch('/api/runtime/execution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userKey, action: 'stop' }),
        })
      }

      router.replace('/login')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleLogout} disabled={loading}>
        {loading ? '로그아웃 중...' : '로그아웃'}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
