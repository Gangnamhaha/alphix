import { NextRequest, NextResponse } from 'next/server'

interface WebhookBody {
  eventType?: string
  paymentKey?: string
  subscriptionId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebhookBody

    return NextResponse.json({
      success: true,
      data: {
        provider: 'tosspayments',
        received: true,
        eventType: body.eventType ?? 'SUBSCRIPTION_BILLING_SUCCEEDED',
        paymentKey: body.paymentKey ?? 'mock_payment_key',
        subscriptionId: body.subscriptionId ?? 'sub_mock_001',
        processedAt: new Date().toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
