import { NextRequest, NextResponse } from 'next/server'

import { ensureExecutionRunning, getExecutionState } from '@/lib/runtime/execution-session'

export async function GET(request: NextRequest) {
  try {
    const userKey = request.cookies.get('mock_email')?.value?.trim().toLowerCase()
    const execution = userKey
      ? (getExecutionState(userKey) ?? ensureExecutionRunning(userKey))
      : null

    return NextResponse.json({
      success: true,
      data: {
        system: 'operational',
        uptimePct: 99.97,
        services: {
          web: 'healthy',
          tradingEngine: 'healthy',
          marketData: 'healthy',
          scheduler: 'healthy',
        },
        execution: execution
          ? {
              running: execution.running,
              startedAt: execution.startedAt,
              lastSeenAt: execution.lastSeenAt,
              stopReason: execution.stopReason,
            }
          : {
              running: false,
              startedAt: null,
              lastSeenAt: null,
              stopReason: 'not_authenticated',
            },
        checkedAt: new Date().toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
