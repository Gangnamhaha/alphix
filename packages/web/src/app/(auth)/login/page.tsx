import Link from 'next/link'

import { LoginForm } from '@/components/auth/login-form'
import { AuthLayout } from '@/components/layouts'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginPageProps {
  searchParams?: Promise<{ signup?: string; profile?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined
  const showSignupSuccess = params?.signup === 'success'
  const showProfileDeferred = params?.profile === 'deferred'

  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-center">로그인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSignupSuccess ? (
            <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
              회원가입이 완료되었습니다. 이메일 인증 후 로그인해 주세요.
            </p>
          ) : null}
          {showProfileDeferred ? (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              현재 서버 프로필 동기화가 지연되어 기본 권한으로 로그인됩니다. 관리자 권한 변경은 서버
              설정 후 적용됩니다.
            </p>
          ) : null}
          <LoginForm />
          <div className="text-center text-sm">
            <Link href="/forgot-password" className="text-muted-foreground hover:underline">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <Link href="/signup" className="text-primary hover:underline">
            계정이 없으신가요? 회원가입
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
