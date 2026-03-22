import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

import { isLocalAuthHost } from '@/lib/auth/mock-auth'
import { stopExecution } from '@/lib/runtime/execution-session'

function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function clearMockCookies(response: NextResponse) {
  for (const name of ['mock_session', 'mock_role', 'mock_email', 'mock_name']) {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    })
    const mockEmail = isLocalAuthHost(
      request.headers.get('x-forwarded-host') ?? request.headers.get('host'),
    )
      ? request.cookies.get('mock_email')?.value
      : undefined

    if (mockEmail) {
      stopExecution(mockEmail, 'logout')
    }

    clearMockCookies(response)

    if (!hasPublicSupabaseEnv()) {
      return response
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          success: false,
          data: { message: 'Logged out locally, but server sign-out failed' },
        },
        {
          status: 500,
          headers: response.headers,
        },
      )
    }

    return response
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
