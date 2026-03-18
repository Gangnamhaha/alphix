import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getUser } from '@/lib/auth/utils'

const summary = [
  { label: '총 자산', value: '₩52,430,000', change: '+2.4%' },
  { label: '오늘 수익', value: '₩312,000', change: '+0.6%' },
  { label: '활성 전략', value: '4개', change: '+1' },
  { label: '승률(30일)', value: '67.2%', change: '+3.1%p' },
]

const recentTrades = [
  { time: '10:32', symbol: '삼성전자', side: '매수', qty: 12, price: '₩82,100', pnl: '+₩15,600' },
  { time: '11:08', symbol: 'NAVER', side: '매도', qty: 4, price: '₩211,500', pnl: '-₩8,300' },
  { time: '13:41', symbol: 'SK하이닉스', side: '매수', qty: 7, price: '₩182,300', pnl: '+₩22,900' },
]

export default async function DashboardPage() {
  const user = await getUser()
  const role = user?.app_metadata?.role ?? user?.user_metadata?.role
  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          🔧 관리자 콘솔로 이동
        </Link>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">전일 대비 {item.change}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>수익 곡선</CardTitle>
          <CardDescription>차트 연동 전까지 사용하는 플레이스홀더</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Equity Curve Chart Placeholder
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 거래</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead>종목</TableHead>
                  <TableHead>구분</TableHead>
                  <TableHead>수량</TableHead>
                  <TableHead>체결가</TableHead>
                  <TableHead>손익</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrades.map((trade) => (
                  <TableRow key={`${trade.time}-${trade.symbol}`}>
                    <TableCell>{trade.time}</TableCell>
                    <TableCell>{trade.symbol}</TableCell>
                    <TableCell>{trade.side}</TableCell>
                    <TableCell>{trade.qty}</TableCell>
                    <TableCell>{trade.price}</TableCell>
                    <TableCell
                      className={trade.pnl.startsWith('+') ? 'text-green-600' : 'text-red-600'}
                    >
                      {trade.pnl}
                    </TableCell>
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
