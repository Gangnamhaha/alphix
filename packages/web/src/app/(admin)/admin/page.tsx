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
import { requireAdmin } from '@/lib/auth/utils'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

function formatDate(value: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleDateString('ko-KR')
}

export default async function AdminPage() {
  await requireAdmin()

  let stats = [
    { label: '총 사용자', value: '-' },
    { label: '활성 구독', value: '-' },
    { label: '활성 전략', value: '-' },
    { label: '오늘 거래 건수', value: '-' },
  ]
  let recentUsers: Array<{ id: number; email: string; role: string; created_at: string | null }> =
    []
  let dataErrorMessage: string | null = null

  try {
    const supabase = createAdminSupabaseClient()

    const [
      { count: usersCount },
      { count: activeSubscriptionsCount },
      { count: activeStrategiesCount },
      { count: todayOrdersCount },
      { data: usersData, error: usersError },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('strategies')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase
        .from('users')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    stats = [
      { label: '총 사용자', value: `${usersCount ?? 0}명` },
      { label: '활성 구독', value: `${activeSubscriptionsCount ?? 0}건` },
      { label: '활성 전략', value: `${activeStrategiesCount ?? 0}개` },
      { label: '오늘 거래 건수', value: `${todayOrdersCount ?? 0}건` },
    ]

    if (usersError) {
      dataErrorMessage = usersError.message
    } else {
      recentUsers = usersData ?? []
    }
  } catch {
    dataErrorMessage =
      '관리자 통계를 불러오지 못했습니다. SUPABASE_SERVICE_ROLE_KEY를 확인해 주세요.'
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">관리자 콘솔</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/users"
            className="rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            사용자 관리
          </Link>
          <Link
            href="/admin/subscriptions"
            className="rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            구독 관리
          </Link>
        </div>
      </div>

      {dataErrorMessage ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {dataErrorMessage}
        </p>
      ) : null}

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
          <CardTitle>최근 가입 사용자</CardTitle>
          <CardDescription>최신 사용자 8명을 표시합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      표시할 사용자가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
