import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const results = [
  { period: '2025 Q1', trades: 42, winRate: '64%', pnl: '+₩1,240,000', mdd: '-4.1%' },
  { period: '2025 Q2', trades: 37, winRate: '68%', pnl: '+₩1,860,000', mdd: '-3.2%' },
  { period: '2025 Q3', trades: 45, winRate: '62%', pnl: '+₩980,000', mdd: '-5.5%' },
]

export default function BacktestPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>백테스트 설정</CardTitle>
          <CardDescription>수수료/슬리피지 포함 시뮬레이션 설정</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input placeholder="전략명 (예: MA Crossover)" />
          <Input placeholder="시작일 (YYYY-MM-DD)" />
          <Input placeholder="종료일 (YYYY-MM-DD)" />
          <Input placeholder="초기 자본 (예: 10000000)" />
          <Input placeholder="수수료 (%)" />
          <Input placeholder="슬리피지 (%)" />
          <Button className="xl:col-span-2">백테스트 실행</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>결과 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>기간</TableHead>
                  <TableHead>거래 수</TableHead>
                  <TableHead>승률</TableHead>
                  <TableHead>손익</TableHead>
                  <TableHead>최대낙폭(MDD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.period}>
                    <TableCell>{result.period}</TableCell>
                    <TableCell>{result.trades}</TableCell>
                    <TableCell>{result.winRate}</TableCell>
                    <TableCell className="text-green-600">{result.pnl}</TableCell>
                    <TableCell>{result.mdd}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
