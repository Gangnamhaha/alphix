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

export default async function AdminSubscriptionsPage() {
  await requireAdmin()

  const supabase = createAdminSupabaseClient()
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan, status, current_period_end')
    .order('current_period_end', { ascending: true })
    .limit(200)

  const userIds = [
    ...new Set(
      (subscriptions ?? [])
        .map((subscription) => subscription.user_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ]
  const { data: users } = userIds.length
    ? await supabase.from('users').select('id, email').in('id', userIds)
    : { data: [] as Array<{ id: string; email: string }> }

  const emailByUserId = new Map((users ?? []).map((user) => [user.id, user.email]))

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>구독 관리</CardTitle>
          <CardDescription>
            플랜 상태와 갱신 일정을 조회하는 관리자 전용 화면입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              구독 조회 중 오류가 발생했습니다: {error.message}
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>구독 ID</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>플랜</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>다음 갱신일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions && subscriptions.length > 0 ? (
                  subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>{subscription.id}</TableCell>
                      <TableCell>
                        {typeof subscription.user_id === 'string'
                          ? (emailByUserId.get(subscription.user_id) ?? '-')
                          : '-'}
                      </TableCell>
                      <TableCell>{subscription.plan ?? 'free'}</TableCell>
                      <TableCell>{subscription.status ?? 'active'}</TableCell>
                      <TableCell>{formatDate(subscription.current_period_end)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      표시할 구독 데이터가 없습니다.
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
