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

interface CancelBody {
  subscriptionId?: string
}

export async function DELETE(request: NextRequest) {
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

    const fromQuery = request.nextUrl.searchParams.get('subscriptionId')
    let fromBody: string | undefined

    try {
      const body = (await request.json()) as CancelBody
      fromBody = body.subscriptionId
    } catch {}

    const rawSubscriptionId = fromQuery ?? fromBody
    const parsedSubscriptionId = rawSubscriptionId ? Number(rawSubscriptionId) : null

    if (!rawSubscriptionId || !Number.isInteger(parsedSubscriptionId)) {
      return NextResponse.json({ error: 'subscriptionId must be a valid integer' }, { status: 400 })
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
    const now = new Date().toISOString()

    const { data, error } = await admin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        canceled_at: now,
      })
      .eq('id', parsedSubscriptionId)
      .eq('user_id', appUserId)
      .select('id, plan, status, payment_provider, canceled_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Subscription cancel failed' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        {
          error: 'Subscription not found or not owned by this account',
          code: 'SUBSCRIPTION_NOT_FOUND',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: data.payment_provider ?? 'tosspayments',
        subscriptionId: String(data.id),
        plan: data.plan,
        status: data.status,
        cancelledAt: data.canceled_at,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
