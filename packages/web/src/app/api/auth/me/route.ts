import { NextRequest, NextResponse } from 'next/server'

import { getUserRoleFromMetadata } from '@/lib/auth/roles'
import { isLocalAuthHost } from '@/lib/auth/mock-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
    const session = isLocalAuthHost(host) ? request.cookies.get('mock_session')?.value : undefined
    const role = request.cookies.get('mock_role')?.value
    const email = request.cookies.get('mock_email')?.value
    const name = request.cookies.get('mock_name')?.value

    if (hasPublicSupabaseEnv()) {
      const supabase = await createServerSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email) {
        return NextResponse.json({
          success: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              name:
                typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : user.email,
              role: getUserRoleFromMetadata(user) ?? 'user',
            },
          },
        })
      }
    }

    if (session !== 'active') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: 'user_mock_001',
          email: email ?? 'mock.user@alphix.kr',
          name: name ?? 'Mock Trader',
          role: role === 'admin' ? 'admin' : 'user',
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
