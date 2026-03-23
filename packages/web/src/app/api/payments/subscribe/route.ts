import { NextRequest, NextResponse } from 'next/server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const PLAN_AMOUNTS: Record<string, number> = {
  basic: 9900,
  pro: 29900,
}

const VALID_PLANS = ['basic', 'pro'] as const
type ValidPlan = (typeof VALID_PLANS)[number]

function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function hasAdminSupabaseEnv() {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

function isValidPlan(value: unknown): value is ValidPlan {
  return typeof value === 'string' && VALID_PLANS.includes(value as ValidPlan)
}

interface SubscribeBody {
  plan?: string
  billingKey?: string
}

export async function POST(request: NextRequest) {
  try {
    if (!hasPublicSupabaseEnv()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as SubscribeBody
    const plan = body.plan

    if (!isValidPlan(plan)) {
      return NextResponse.json(
        { error: `plan must be one of: ${VALID_PLANS.join(', ')}` },
        { status: 400 },
      )
    }

    if (!hasAdminSupabaseEnv()) {
      return NextResponse.json({ error: 'Subscription write is unavailable' }, { status: 503 })
    }

    const admin = createAdminSupabaseClient()
    const { data: appUsers, error: appUserError } = await admin
      .from('users')
      .select('id')
      .eq('email', user.email.toLowerCase())

    if (appUserError) {
      return NextResponse.json({ error: 'Subscription write is unavailable' }, { status: 503 })
    }

    if (!appUsers?.length) {
      return NextResponse.json(
        {
          error: 'Subscription profile is not linked to this account',
          code: 'SUBSCRIPTION_PROFILE_UNLINKED',
        },
        { status: 409 },
      )
    }

    if (appUsers.length > 1) {
      return NextResponse.json(
        {
          error: 'Subscription write is ambiguous',
          code: 'SUBSCRIPTION_PROFILE_AMBIGUOUS',
        },
        { status: 409 },
      )
    }

    const appUserId = appUsers[0].id
    const now = new Date()
    const nextPeriodEnd = new Date(now)
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1)

    const { data, error } = await admin
      .from('subscriptions')
      .upsert(
        {
          user_id: appUserId,
          plan,
          status: 'active',
          payment_provider: 'tosspayments',
          billing_key: typeof body.billingKey === 'string' ? body.billingKey : null,
          current_period_start: now.toISOString(),
          current_period_end: nextPeriodEnd.toISOString(),
          canceled_at: null,
        },
        { onConflict: 'user_id' },
      )
      .select('id, plan, status, payment_provider, current_period_end, created_at')
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ error: 'Subscription write failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: data.payment_provider ?? 'tosspayments',
        subscriptionId: String(data.id),
        plan: data.plan,
        amount: PLAN_AMOUNTS[plan] ?? 0,
        status: data.status,
        approvedAt: data.created_at ?? now.toISOString(),
        nextBillingAt: data.current_period_end,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
