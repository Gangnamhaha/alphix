'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type FormSubmitEvent = Parameters<NonNullable<React.ComponentProps<'form'>['onSubmit']>>[0]

export function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const normalizedIdentifier = identifier.trim()

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: normalizedIdentifier,
          email: normalizedIdentifier.includes('@') ? normalizedIdentifier : undefined,
          password,
        }),
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        data?: { user?: { role?: string } }
      } | null

      if (!response.ok) {
        setError(payload?.error ?? '로그인에 실패했습니다.')
        return
      }

      router.replace(payload?.data?.user?.role === 'admin' ? '/admin' : '/dashboard')
      router.refresh()
    } catch {
      setError('로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        type="text"
        placeholder="이메일 또는 아이디"
        autoComplete="username"
        value={identifier}
        onChange={(event) => setIdentifier(event.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="비밀번호"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  )
}
