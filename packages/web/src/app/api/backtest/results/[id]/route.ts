import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Result id is required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        result: {
          id,
          strategyId: 'str_001',
          symbol: '005930',
          period: {
            start: '2025-01-01',
            end: '2025-12-31',
          },
          metrics: {
            totalReturnPct: 12.4,
            maxDrawdownPct: -5.8,
            sharpeRatio: 1.42,
            winRatePct: 57.1,
          },
          equityCurve: [1000000, 1008000, 997000, 1012500, 1046000, 1124000],
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
