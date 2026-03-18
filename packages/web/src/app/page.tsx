import Link from 'next/link'

import { LandingLayout } from '@/components/layouts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  { title: '🤖 자동매매', desc: '6개 브로커 지원, 24시간 무인 거래' },
  { title: '📊 6개 전략', desc: 'MA, RSI, 볼린저, MACD, 그리드, AI' },
  { title: '🧪 백테스팅', desc: '수수료, 슬리피지 반영 고급 시뮬레이션' },
  { title: '🔒 안전 설계', desc: 'AES-256 암호화, 회로차단기, 30일 페이퍼' },
]

const plans = [
  { name: 'Free', price: '₩0', features: ['전략 1개', '페이퍼만', '백테스트 5회/월'] },
  { name: 'Basic', price: '₩9,900/월', features: ['전략 3개', '실전 거래', '백테스트 무제한'] },
  { name: 'Pro', price: '₩29,900/월', features: ['전략 무제한', 'AI 전략', 'API 접근'] },
]

export default function LandingPage() {
  return (
    <LandingLayout>
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="mb-4 text-4xl font-bold">한국 주식 자동매매 플랫폼</h1>
        <p className="mb-8 text-lg text-muted-foreground">AI 기반 전략으로 24시간 자동 거래</p>
        <Button asChild size="lg">
          <Link href="/signup">무료로 시작하기</Link>
        </Button>
      </section>
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-16 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">요금제</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-sm">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>투자에는 원금 손실의 위험이 있습니다.</p>
        <p className="mt-1">© 2026 Alphix. All rights reserved.</p>
      </footer>
    </LandingLayout>
  )
}
