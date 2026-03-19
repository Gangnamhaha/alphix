import Link from 'next/link'

import { SignupForm } from '@/components/auth/signup-form'
import { AuthLayout } from '@/components/layouts'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-center">회원가입</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignupForm />
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            이미 계정이 있으신가요? 로그인
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
