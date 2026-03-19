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

export default async function AdminUsersPage() {
  await requireAdmin()

  const supabase = createAdminSupabaseClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>사용자 관리</CardTitle>
          <CardDescription>
            전체 사용자 권한/상태를 조회하는 관리자 전용 화면입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              사용자 조회 중 오류가 발생했습니다: {error.message}
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name ?? '-'}</TableCell>
                      <TableCell>{user.role ?? 'user'}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
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
