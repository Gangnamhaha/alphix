import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const stats = [
  { label: '총 사용자', value: '3,428명' },
  { label: '유료 구독', value: '1,096명' },
  { label: '활성 전략', value: '7,882개' },
  { label: '오늘 거래 건수', value: '24,390건' },
]

const users = [
  { id: 'U-10291', email: 'trader1@alphix.ai', plan: 'Pro', status: 'Active', joined: '2026-01-11' },
  { id: 'U-10420', email: 'beta.user@alphix.ai', plan: 'Basic', status: 'Active', joined: '2026-02-07' },
  { id: 'U-10498', email: 'swing@alphix.ai', plan: 'Free', status: 'Pending', joined: '2026-02-28' },
  { id: 'U-10534', email: 'kim.alpha@alphix.ai', plan: 'Pro', status: 'Suspended', joined: '2026-03-02' },
]

export default function AdminPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">관리자 콘솔</h1>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>플랜</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.plan}</TableCell>
                    <TableCell>{user.status}</TableCell>
                    <TableCell>{user.joined}</TableCell>
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
