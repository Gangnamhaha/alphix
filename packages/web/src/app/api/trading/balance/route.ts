import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        currency: 'KRW',
        cash: 1250000,
        buyingPower: 3750000,
        equity: 4920000,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
