import { NextRequest, NextResponse } from 'next/server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'

function hasAdminSupabaseEnv() {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

interface WebhookBody {
  eventType?: string
  paymentKey?: string
  subscriptionId?: string
  orderId?: string
}

type WebhookEventType =
  | 'SUBSCRIPTION_BILLING_SUCCEEDED'
  | 'SUBSCRIPTION_BILLING_FAILED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'PAYMENT_APPROVED'

function resolveStatusFromEvent(eventType: string): string | null {
  switch (eventType) {
    case 'SUBSCRIPTION_BILLING_SUCCEEDED':
    case 'PAYMENT_APPROVED':
      return 'active'
    case 'SUBSCRIPTION_BILLING_FAILED':
      return 'past_due'
    case 'SUBSCRIPTION_CANCELLED':
      return 'cancelled'
    default:
      return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebhookBody

    const eventType = (body.eventType ?? '') as WebhookEventType
    const rawSubscriptionId = body.subscriptionId
    const parsedSubscriptionId = rawSubscriptionId ? Number(rawSubscriptionId) : null
    const now = new Date().toISOString()

    const newStatus = resolveStatusFromEvent(eventType)

    if (
      hasAdminSupabaseEnv() &&
      newStatus !== null &&
      parsedSubscriptionId !== null &&
      Number.isInteger(parsedSubscriptionId)
    ) {
      const admin = createAdminSupabaseClient()
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
      }

      if (newStatus === 'active') {
        const nextPeriodEnd = new Date()
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1)
        updatePayload.current_period_start = now
        updatePayload.current_period_end = nextPeriodEnd.toISOString()
        updatePayload.canceled_at = null
      }

      if (newStatus === 'cancelled') {
        updatePayload.canceled_at = now
      }

      await admin.from('subscriptions').update(updatePayload).eq('id', parsedSubscriptionId)
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: 'tosspayments',
        received: true,
        eventType: eventType || 'UNKNOWN',
        paymentKey: body.paymentKey ?? null,
        subscriptionId: rawSubscriptionId ?? null,
        processedAt: now,
        statusApplied: newStatus,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
