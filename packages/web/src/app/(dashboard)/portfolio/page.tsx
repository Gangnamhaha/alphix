import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const positions = [
  { symbol: '삼성전자', qty: 120, avgPrice: '₩80,400', currentPrice: '₩82,100', pnl: '+₩204,000', ratio: '34%' },
  { symbol: 'SK하이닉스', qty: 60, avgPrice: '₩176,200', currentPrice: '₩182,300', pnl: '+₩366,000', ratio: '26%' },
  { symbol: 'NAVER', qty: 25, avgPrice: '₩214,000', currentPrice: '₩211,500', pnl: '-₩62,500', ratio: '14%' },
]

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">총 평가금액</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">₩52,430,000</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">총 손익(P&L)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-green-600">+₩1,128,000</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">현금 비중</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">26%</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>보유 포지션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>종목</TableHead>
                  <TableHead>수량</TableHead>
                  <TableHead>평균단가</TableHead>
                  <TableHead>현재가</TableHead>
                  <TableHead>손익</TableHead>
                  <TableHead>비중</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.symbol}>
                    <TableCell>{position.symbol}</TableCell>
                    <TableCell>{position.qty}</TableCell>
                    <TableCell>{position.avgPrice}</TableCell>
                    <TableCell>{position.currentPrice}</TableCell>
                    <TableCell className={position.pnl.startsWith('+') ? 'text-green-600' : 'text-red-600'}>{position.pnl}</TableCell>
                    <TableCell>{position.ratio}</TableCell>
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
