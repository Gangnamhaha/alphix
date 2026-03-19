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
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== passwordConfirm) {
      setError('비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      const profileResponse = await fetch('/api/auth/register-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      })

      if (!profileResponse.ok) {
        setError('가입 프로필 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      if (data.session) {
        router.replace('/dashboard')
        router.refresh()
        return
      }

      setSuccess('회원가입이 완료되었습니다. 이메일 인증 후 로그인해 주세요.')
      router.replace('/login?signup=success')
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
      {success ? <p className="text-sm text-green-700">{success}</p> : null}
      <Button className="w-full" type="submit" disabled={loading}>
        {loading ? '가입 처리 중...' : '무료로 시작하기'}
      </Button>
    </form>
  )
}
