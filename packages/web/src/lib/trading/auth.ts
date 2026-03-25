import { NextRequest, NextResponse } from 'next/server'

import { isLocalAuthHost } from '@/lib/auth/mock-auth'
import type { BrokerSettingsIdentity } from '@/lib/settings/broker-settings'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface TradingAuthDeps {
  hasPublicSupabaseEnv?: () => boolean
  isLocalAuthHost?: (host: string | null | undefined) => boolean
  createServerSupabaseClient?: () => Promise<ServerSupabaseClientLike>
}

interface ServerSupabaseClientLike {
  auth: {
    getUser(): Promise<{
      data: {
        user: {
          email?: string | null
        } | null
      }
    }>
  }
}

function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function readTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function resolveAuthenticatedIdentity(
  request: NextRequest,
  deps: TradingAuthDeps = {},
): Promise<BrokerSettingsIdentity | NextResponse> {
  const hasPublicEnv = deps.hasPublicSupabaseEnv ?? hasPublicSupabaseEnv
  const isLocalHost = deps.isLocalAuthHost ?? isLocalAuthHost
  const createSupabaseClient = deps.createServerSupabaseClient ?? createServerSupabaseClient
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const isMockSession = isLocalHost(host) && request.cookies.get('mock_session')?.value === 'active'

  if (!hasPublicEnv()) {
    if (isMockSession) {
      return {
        email:
          readTrimmedString(request.cookies.get('mock_email')?.value).toLowerCase() ||
          'mock.user@alphix.kr',
        isMockSession: true,
      }
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    if (isMockSession) {
      return {
        email:
          readTrimmedString(request.cookies.get('mock_email')?.value).toLowerCase() ||
          'mock.user@alphix.kr',
        isMockSession: true,
      }
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return {
    email: user.email.trim().toLowerCase(),
    isMockSession: false,
  }
}
