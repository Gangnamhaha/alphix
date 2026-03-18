import { NextRequest, NextResponse } from 'next/server'

interface StrategyBody {
  name?: string
  type?: string
  symbol?: string
  riskLevel?: 'low' | 'medium' | 'high'
}

export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        strategies: [
          {
            id: 'str_001',
            name: 'RSI Reversal',
            type: 'rsi',
            symbol: '005930',
            riskLevel: 'medium',
            isActive: true,
          },
          {
            id: 'str_002',
            name: 'MA Trend',
            type: 'moving-average',
            symbol: '000660',
            riskLevel: 'low',
            isActive: false,
          },
        ],
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StrategyBody
    const name = body.name?.trim()
    const type = body.type?.trim()
    const symbol = body.symbol?.trim().toUpperCase()

    if (!name || !type || !symbol) {
      return NextResponse.json({ error: 'name, type and symbol are required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        strategy: {
          id: `str_${Date.now()}`,
          name,
          type,
          symbol,
          riskLevel: body.riskLevel ?? 'medium',
          isActive: false,
          createdAt: new Date().toISOString(),
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
