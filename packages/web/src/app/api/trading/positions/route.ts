import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        positions: [
          {
            symbol: '005930',
            quantity: 12,
            avgPrice: 71200,
            currentPrice: 72800,
            unrealizedPnl: 19200,
          },
          {
            symbol: '035420',
            quantity: 8,
            avgPrice: 198000,
            currentPrice: 201500,
            unrealizedPnl: 28000,
          },
        ],
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
