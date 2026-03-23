import { NextRequest, NextResponse } from 'next/server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function hasAdminSupabaseEnv() {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

export async function GET(request: NextRequest) {
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

    const rawSubscriptionId = request.nextUrl.searchParams.get('subscriptionId')
    const parsedSubscriptionId = rawSubscriptionId ? Number(rawSubscriptionId) : null

    if (rawSubscriptionId && !Number.isInteger(parsedSubscriptionId)) {
      return NextResponse.json({ error: 'subscriptionId must be an integer' }, { status: 400 })
    }

    if (!hasAdminSupabaseEnv()) {
      return NextResponse.json({ error: 'Subscription lookup is unavailable' }, { status: 503 })
    }

    const admin = createAdminSupabaseClient()
    const { data: appUsers, error: appUserError } = await admin
      .from('users')
      .select('id')
      .eq('email', user.email.toLowerCase())

    if (appUserError) {
      return NextResponse.json({ error: 'Subscription lookup is unavailable' }, { status: 503 })
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
          error: 'Subscription lookup is ambiguous',
          code: 'SUBSCRIPTION_PROFILE_AMBIGUOUS',
        },
        { status: 409 },
      )
    }

    const appUserId = appUsers[0].id
    let query = admin
      .from('subscriptions')
      .select('id, plan, status, payment_provider, current_period_end, created_at')
      .eq('user_id', appUserId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (parsedSubscriptionId !== null) {
      query = admin
        .from('subscriptions')
        .select('id, plan, status, payment_provider, current_period_end, created_at')
        .eq('user_id', appUserId)
        .eq('id', parsedSubscriptionId)
        .limit(1)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Subscription lookup failed' }, { status: 500 })
    }

    const subscription = data?.[0] ?? null

    return NextResponse.json({
      success: true,
      data: {
        provider: subscription?.payment_provider ?? 'tosspayments',
        subscriptionId: subscription ? String(subscription.id) : null,
        plan: subscription?.plan ?? 'free',
        status: subscription?.status ?? 'inactive',
        nextBillingAt: subscription?.current_period_end ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
