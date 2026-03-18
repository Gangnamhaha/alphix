import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        results: [
          {
            id: 'bt_001',
            strategyId: 'str_001',
            symbol: '005930',
            totalReturnPct: 12.4,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          },
          {
            id: 'bt_002',
            strategyId: 'str_002',
            symbol: '000660',
            totalReturnPct: 8.9,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          },
        ],
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
