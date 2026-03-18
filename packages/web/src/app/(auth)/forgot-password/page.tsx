import Link from 'next/link'

import { AuthLayout } from '@/components/layouts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-center">비밀번호 재설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.</p>
          <Input type="email" placeholder="이메일" required />
          <Button className="w-full">재설정 링크 보내기</Button>
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            로그인 화면으로 돌아가기
          </Link>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
