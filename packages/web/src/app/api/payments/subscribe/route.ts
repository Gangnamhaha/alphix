import { NextRequest, NextResponse } from 'next/server'

interface SubscribeBody {
  plan?: 'basic' | 'pro'
  customerKey?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubscribeBody

    if (!body.plan || !body.customerKey) {
      return NextResponse.json({ error: 'plan and customerKey are required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: 'tosspayments',
        subscriptionId: `sub_${Date.now()}`,
        plan: body.plan,
        amount: body.plan === 'pro' ? 29900 : 9900,
        status: 'active',
        approvedAt: new Date().toISOString(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
