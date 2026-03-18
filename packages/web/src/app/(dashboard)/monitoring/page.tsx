import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const systems = [
  { name: '가격 수집기', status: '정상', latency: '32ms' },
  { name: '시그널 엔진', status: '정상', latency: '57ms' },
  { name: '주문 라우터', status: '주의', latency: '183ms' },
  { name: '알림 서비스', status: '정상', latency: '21ms' },
]

const logs = [
  '09:14:22 INFO  MA Crossover signal BUY 삼성전자',
  '09:14:24 INFO  Order accepted KR-20260318-9231',
  '09:14:28 WARN  Router latency elevated: 183ms',
  '09:14:31 INFO  Fill confirmed 삼성전자 12주',
  '09:14:42 INFO  Notification sent to Slack #trading-alerts',
]

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {systems.map((system) => (
          <Card key={system.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{system.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                상태:{' '}
                <span className={system.status === '정상' ? 'text-green-600' : 'text-amber-600'}>{system.status}</span>
              </p>
              <p className="text-muted-foreground">지연시간 {system.latency}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>실시간 로그</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-secondary/40 p-4 font-mono text-xs leading-6">
            {logs.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
