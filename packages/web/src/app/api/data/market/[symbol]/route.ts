import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol: rawSymbol } = await context.params
    const symbol = rawSymbol?.toUpperCase()

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    const interval = request.nextUrl.searchParams.get('interval') ?? '1d'

    return NextResponse.json({
      success: true,
      data: {
        symbol,
        interval,
        quote: {
          open: 71200,
          high: 73100,
          low: 70900,
          close: 72800,
          volume: 12450231,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
