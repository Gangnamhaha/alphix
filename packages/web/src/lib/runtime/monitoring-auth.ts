import type { NextRequest } from 'next/server'

import { isLocalAuthHost } from '@/lib/auth/mock-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function readTrimmedString(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

export async function resolveMonitoringUserKey(request: NextRequest) {
  if (hasPublicSupabaseEnv()) {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.email) {
      return readTrimmedString(user.email)
    }
  }

  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')

  if (!isLocalAuthHost(host) || request.cookies.get('mock_session')?.value !== 'active') {
    return ''
  }

  return readTrimmedString(request.cookies.get('mock_email')?.value)
}
