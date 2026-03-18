import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        logs: [
          {
            id: 'log_001',
            level: 'info',
            event: 'ORDER_SUBMITTED',
            message: '005930 buy order submitted',
            timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
          },
          {
            id: 'log_002',
            level: 'warn',
            event: 'SLIPPAGE_ALERT',
            message: 'Execution price deviated by 0.8%',
            timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
          },
        ],
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
