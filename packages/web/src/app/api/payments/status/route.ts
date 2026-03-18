import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const subscriptionId = request.nextUrl.searchParams.get('subscriptionId') ?? 'sub_mock_001'

    return NextResponse.json({
      success: true,
      data: {
        provider: 'tosspayments',
        subscriptionId,
        plan: 'pro',
        status: 'active',
        nextBillingAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
