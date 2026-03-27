import { NextRequest, NextResponse } from 'next/server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface RegisterProfileBody {
  email?: string
  name?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SUPABASE_AUTH_SENTINEL = '$supabase_auth$'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterProfileBody
    const email = body.email?.trim().toLowerCase()
    const name = body.name?.trim() ?? null

    if (!email || !emailPattern.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    let supabase

    try {
      supabase = createAdminSupabaseClient()
    } catch {
      return NextResponse.json(
        {
          error: 'Profile sync is unavailable',
          code: 'PROFILE_SYNC_UNAVAILABLE',
        },
        { status: 503 },
      )
    }

    const { error: insertError } = await supabase.from('users').insert({
      id: crypto.randomUUID(),
      email,
      name,
      password_hash: SUPABASE_AUTH_SENTINEL,
    })

    if (!insertError) {
      return NextResponse.json({ success: true })
    }

    if (insertError.code === '23505') {
      const { error: updateError } = await supabase
        .from('users')
        .update({ name })
        .eq('email', email)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message, code: 'PROFILE_SYNC_FAILED' },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: insertError.message, code: 'PROFILE_SYNC_FAILED' },
      { status: 500 },
    )
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong', code: 'PROFILE_SYNC_UNKNOWN' },
      { status: 500 },
    )
  }
}
