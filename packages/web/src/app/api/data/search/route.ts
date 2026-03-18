import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
    }

    const results = [
      { symbol: '005930', name: '삼성전자', market: 'KOSPI' },
      { symbol: '000660', name: 'SK하이닉스', market: 'KOSPI' },
      { symbol: '035420', name: 'NAVER', market: 'KOSPI' },
      { symbol: '035720', name: '카카오', market: 'KOSPI' },
    ].filter((item) => item.symbol.includes(query) || item.name.includes(query.toUpperCase()))

    return NextResponse.json({
      success: true,
      data: {
        query,
        results,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
