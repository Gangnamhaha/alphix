import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
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
        checkedAt: new Date().toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
