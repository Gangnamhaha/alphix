'use client'

import { useEffect, useMemo, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MonitoringStatusResponse {
  success: true
  data: {
    system: string
    uptimePct: number
    services: Record<string, string>
    execution: {
      running: boolean
      startedAt: string | null
      lastSeenAt: string | null
      stopReason: string | null
    }
    checkedAt: string
  }
}

interface MonitoringLogsResponse {
  success: true
  data: {
    logs: Array<{
      id: string
      level: 'info' | 'warn'
      event: string
      message: string
      timestamp: string
    }>
  }
}

const serviceLabels: Record<string, string> = {
  web: '웹 앱',
  tradingEngine: '자동매매 엔진',
  marketData: '가격 수집기',
  scheduler: '스케줄러',
}

function formatServiceStatus(status: string) {
  switch (status) {
    case 'healthy':
      return '정상'
    case 'warning':
      return '주의'
    case 'degraded':
      return '저하'
    case 'down':
      return '장애'
    default:
      return status
  }
}

function statusClassName(status: string) {
  switch (status) {
    case 'healthy':
      return 'text-green-600'
    case 'warning':
    case 'degraded':
      return 'text-amber-600'
    case 'down':
      return 'text-red-600'
    default:
      return 'text-muted-foreground'
  }
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return '없음'
  }

  return new Date(value).toLocaleString('ko-KR')
}

export default function MonitoringPage() {
  const [statusData, setStatusData] = useState<MonitoringStatusResponse['data'] | null>(null)
  const [logItems, setLogItems] = useState<MonitoringLogsResponse['data']['logs']>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    async function loadMonitoring() {
      setIsLoading(true)
      setError(null)

      try {
        const [statusResponse, logsResponse] = await Promise.all([
          fetch('/api/monitoring/status', { cache: 'no-store' }),
          fetch('/api/monitoring/logs', { cache: 'no-store' }),
        ])

        if (!statusResponse.ok || !logsResponse.ok) {
          throw new Error('모니터링 정보를 불러오지 못했습니다.')
        }

        const statusPayload = (await statusResponse.json()) as MonitoringStatusResponse
        const logsPayload = (await logsResponse.json()) as MonitoringLogsResponse

        if (!isActive) {
          return
        }

        setStatusData(statusPayload.data)
        setLogItems(logsPayload.data.logs)
      } catch (loadError) {
        if (!isActive) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : '모니터링 정보를 불러오는 중 문제가 발생했습니다.',
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadMonitoring()

    return () => {
      isActive = false
    }
  }, [])

  const systems = useMemo(() => {
    if (!statusData) {
      return []
    }

    return Object.entries(statusData.services).map(([key, status]) => ({
      key,
      name: serviceLabels[key] ?? key,
      status,
    }))
  }, [statusData])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">모니터링</h1>
        <p className="text-sm text-muted-foreground">
          {statusData
            ? `시스템 상태 ${statusData.system} · 가용성 ${statusData.uptimePct.toFixed(2)}% · 마지막 확인 ${formatTimestamp(statusData.checkedAt)}`
            : '실시간 상태와 실행 로그를 확인합니다.'}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading && !systems.length
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={`loading-${index}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">불러오는 중...</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>상태를 확인하고 있습니다.</p>
                </CardContent>
              </Card>
            ))
          : systems.map((system) => (
              <Card key={system.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{system.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>
                    상태:{' '}
                    <span className={statusClassName(system.status)}>
                      {formatServiceStatus(system.status)}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    마지막 확인 {statusData ? formatTimestamp(statusData.checkedAt) : '대기 중'}
                  </p>
                </CardContent>
              </Card>
            ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>실행 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {statusData ? (
            <>
              <p>
                현재 상태:{' '}
                <span
                  className={
                    statusData.execution.running ? 'text-green-600' : 'text-muted-foreground'
                  }
                >
                  {statusData.execution.running ? '실행 중' : '중지됨'}
                </span>
              </p>
              <p className="text-muted-foreground">
                시작 시각 {formatTimestamp(statusData.execution.startedAt)} · 마지막 활동{' '}
                {formatTimestamp(statusData.execution.lastSeenAt)}
              </p>
              <p className="text-muted-foreground">
                중지 사유 {statusData.execution.stopReason ?? '없음'}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">실행 상태를 불러오는 중입니다.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>실시간 로그</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-secondary/40 p-4 font-mono text-xs leading-6">
            {isLoading && !logItems.length ? (
              <p>로그를 불러오는 중입니다.</p>
            ) : logItems.length ? (
              logItems.map((log) => (
                <p key={log.id}>
                  [{new Date(log.timestamp).toLocaleTimeString('ko-KR', { hour12: false })}]{' '}
                  {log.level.toUpperCase()} {log.event} {log.message}
                </p>
              ))
            ) : (
              <p>아직 기록된 실행 로그가 없습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
