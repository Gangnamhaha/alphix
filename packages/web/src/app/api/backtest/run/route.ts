import { NextRequest, NextResponse } from 'next/server'

interface BacktestRunBody {
  strategyId?: string
  symbol?: string
  startDate?: string
  endDate?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BacktestRunBody

    if (!body.strategyId || !body.symbol || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'strategyId, symbol, startDate and endDate are required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        job: {
          id: `bt_job_${Date.now()}`,
          strategyId: body.strategyId,
          symbol: body.symbol.toUpperCase(),
          startDate: body.startDate,
          endDate: body.endDate,
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        metrics: {
          totalReturnPct: 12.4,
          maxDrawdownPct: -5.8,
          winRatePct: 57.1,
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
