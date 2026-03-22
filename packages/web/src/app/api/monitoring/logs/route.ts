import { NextRequest, NextResponse } from 'next/server'

import { getExecutionLogs } from '@/lib/runtime/execution-session'
import { resolveMonitoringUserKey } from '@/lib/runtime/monitoring-auth'

export async function GET(_request: NextRequest) {
  try {
    const userKey = await resolveMonitoringUserKey(_request)
    const logs = userKey ? getExecutionLogs(userKey) : []

    return NextResponse.json({
      success: true,
      data: {
        logs,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
