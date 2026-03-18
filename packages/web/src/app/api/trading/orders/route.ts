import { NextRequest, NextResponse } from 'next/server'

interface CreateOrderBody {
  symbol?: string
  side?: 'buy' | 'sell'
  orderType?: 'market' | 'limit'
  quantity?: number
  price?: number
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderBody
    const symbol = body.symbol?.trim().toUpperCase()

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    if (!body.side || !['buy', 'sell'].includes(body.side)) {
      return NextResponse.json({ error: 'Valid side is required' }, { status: 400 })
    }

    if (!body.quantity || body.quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
    }

    if (body.orderType === 'limit' && (!body.price || body.price <= 0)) {
      return NextResponse.json({ error: 'Limit order price is required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id: `ord_${Date.now()}`,
          symbol,
          side: body.side,
          orderType: body.orderType ?? 'market',
          quantity: body.quantity,
          price: body.price ?? null,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')

    const orders = [
      {
        id: 'ord_1001',
        symbol: '005930',
        side: 'buy',
        orderType: 'limit',
        quantity: 10,
        price: 72000,
        status: 'filled',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 'ord_1002',
        symbol: '000660',
        side: 'sell',
        orderType: 'market',
        quantity: 5,
        price: null,
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ]

    const filteredOrders = status ? orders.filter((order) => order.status === status) : orders

    return NextResponse.json({
      success: true,
      data: {
        orders: filteredOrders,
        total: filteredOrders.length,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
