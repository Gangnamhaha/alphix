import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const strategies = [
  { name: 'MA Crossover', type: '추세', status: '실행 중', roi: '+14.2%' },
  { name: 'RSI Reversion', type: '역추세', status: '일시정지', roi: '+6.8%' },
  { name: 'Bollinger Breakout', type: '변동성', status: '실행 중', roi: '+11.1%' },
  { name: 'AI Momentum', type: 'AI', status: '실행 중', roi: '+19.7%' },
]

export default function StrategiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">전략 관리</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>새 전략 만들기</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 전략 생성</DialogTitle>
              <DialogDescription>목업 화면입니다. 입력 값은 저장되지 않습니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <Input placeholder="전략 이름" />
              <Input placeholder="대상 종목 (예: 삼성전자, SK하이닉스)" />
              <Input placeholder="진입 조건" />
            </div>
            <DialogFooter>
              <Button variant="outline">취소</Button>
              <Button>생성</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {strategies.map((strategy) => (
          <Card key={strategy.name}>
            <CardHeader>
              <CardTitle>{strategy.name}</CardTitle>
              <CardDescription>{strategy.type} 전략</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                상태: <span className={strategy.status === '실행 중' ? 'text-green-600' : 'text-amber-600'}>{strategy.status}</span>
              </p>
              <p>누적 수익률: {strategy.roi}</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" size="sm">
                수정
              </Button>
              <Button size="sm">상세 보기</Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  )
}
