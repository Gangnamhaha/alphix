import { NextRequest, NextResponse } from 'next/server'

interface CancelBody {
  subscriptionId?: string
}

export async function DELETE(request: NextRequest) {
  try {
    const fromQuery = request.nextUrl.searchParams.get('subscriptionId')
    let fromBody: string | undefined

    try {
      const body = (await request.json()) as CancelBody
      fromBody = body.subscriptionId
    } catch {}

    const subscriptionId = fromQuery ?? fromBody

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: 'tosspayments',
        subscriptionId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
