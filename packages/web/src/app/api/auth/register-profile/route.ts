import { NextRequest, NextResponse } from 'next/server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface RegisterProfileBody {
  email?: string
  name?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

    const { error } = await supabase.from('users').upsert(
      {
        email,
        name,
        role: 'user',
      },
      { onConflict: 'email' },
    )

    if (error) {
      return NextResponse.json(
        { error: error.message, code: 'PROFILE_SYNC_FAILED' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong', code: 'PROFILE_SYNC_UNKNOWN' },
      { status: 500 },
    )
  }
}
