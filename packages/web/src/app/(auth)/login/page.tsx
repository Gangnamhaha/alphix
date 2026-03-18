import Link from 'next/link'

import { AuthLayout } from '@/components/layouts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  return (
    <AuthLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-center">로그인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="email" placeholder="이메일" required />
          <Input type="password" placeholder="비밀번호" required />
          <Button className="w-full">로그인</Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">또는</span>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Google로 계속하기
          </Button>
          <Button variant="outline" className="w-full">
            Kakao로 계속하기
          </Button>
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
