'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

type FormSubmitEvent = Parameters<NonNullable<React.ComponentProps<'form'>['onSubmit']>>[0]

export function SignupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault()
    setError(null)

    if (password !== passwordConfirm) {
      setError('비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(payload.error ?? '회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(
          '가입은 완료됐으나 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해 주세요.',
        )
        router.replace('/login?signup=success')
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setError('회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        type="text"
        placeholder="이름"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <Input
        type="email"
        placeholder="이메일"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="비밀번호"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        minLength={8}
        required
      />
      <Input
        type="password"
        placeholder="비밀번호 확인"
        autoComplete="new-password"
        value={passwordConfirm}
        onChange={(event) => setPasswordConfirm(event.target.value)}
        minLength={8}
        required
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={loading}>
        {loading ? '가입 처리 중...' : '무료로 시작하기'}
      </Button>
    </form>
  )
}
