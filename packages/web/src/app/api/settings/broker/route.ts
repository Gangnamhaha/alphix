import { NextRequest, NextResponse } from 'next/server'

import { isLocalAuthHost } from '@/lib/auth/mock-auth'
import {
  BrokerSettingsServiceError,
  getBrokerSettingsSnapshot,
  updateBrokerSettings,
} from '@/lib/settings/broker-settings'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface AuthenticatedIdentity {
  email: string
  isMockSession: boolean
}

function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function readTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

async function resolveAuthenticatedIdentity(
  request: NextRequest,
): Promise<AuthenticatedIdentity | NextResponse> {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const isMockSession =
    isLocalAuthHost(host) && request.cookies.get('mock_session')?.value === 'active'

  if (!hasPublicSupabaseEnv()) {
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

  const supabase = await createServerSupabaseClient()
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

export async function GET(request: NextRequest) {
  try {
    const identity = await resolveAuthenticatedIdentity(request)

    if (identity instanceof NextResponse) {
      return identity
    }

    const data = await getBrokerSettingsSnapshot(identity)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const identity = await resolveAuthenticatedIdentity(request)

    if (identity instanceof NextResponse) {
      return identity
    }

    const body = await request.json()
    const config = await updateBrokerSettings(identity, body)

    return NextResponse.json({
      success: true,
      data: {
        config,
      },
    })
  } catch (error) {
    if (error instanceof BrokerSettingsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
