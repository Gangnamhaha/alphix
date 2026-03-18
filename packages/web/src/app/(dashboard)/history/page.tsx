import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const histories = [
  { date: '2026-03-14 09:13', symbol: '삼성전자', type: '매수', qty: 10, price: '₩81,900', fee: '₩1,300' },
  { date: '2026-03-14 11:05', symbol: 'LG에너지솔루션', type: '매도', qty: 2, price: '₩367,000', fee: '₩1,100' },
  { date: '2026-03-15 10:41', symbol: 'NAVER', type: '매수', qty: 5, price: '₩212,800', fee: '₩1,200' },
  { date: '2026-03-15 14:28', symbol: 'SK하이닉스', type: '매도', qty: 3, price: '₩183,100', fee: '₩1,000' },
]

export default function HistoryPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>거래 내역</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일시</TableHead>
                <TableHead>종목</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>수량</TableHead>
                <TableHead>체결가</TableHead>
                <TableHead>수수료</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {histories.map((history) => (
                <TableRow key={`${history.date}-${history.symbol}`}>
                  <TableCell>{history.date}</TableCell>
                  <TableCell>{history.symbol}</TableCell>
                  <TableCell>{history.type}</TableCell>
                  <TableCell>{history.qty}</TableCell>
                  <TableCell>{history.price}</TableCell>
                  <TableCell>{history.fee}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
