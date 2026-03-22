import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

import { getUserRoleFromMetadata } from '@/lib/auth/roles'
import { isLocalAuthHost } from '@/lib/auth/mock-auth'
import { ensureExecutionRunning } from '@/lib/runtime/execution-session'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LoginBody {
  identifier?: string
  email?: string
  password?: string
}

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

function createMockLoginResponse(email: string, role: 'admin' | 'user', name: string) {
  ensureExecutionRunning(email)

  const response = NextResponse.json({
    success: true,
    data: {
      user: {
        id: role === 'admin' ? 'user_mock_admin' : 'user_mock_001',
        email,
        name,
        role,
      },
      accessToken: role === 'admin' ? 'mock_access_token_admin' : 'mock_access_token',
    },
  })

  response.cookies.set('mock_session', 'active', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  response.cookies.set('mock_role', role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  response.cookies.set('mock_email', email, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  response.cookies.set('mock_name', name, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  return response
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody
    const identifier = body.identifier?.trim()
    const email = body.email?.trim()
    const password = body.password?.trim()
    const loginId = identifier ?? email
    const allowMockAuth = isLocalAuthHost(
      request.headers.get('x-forwarded-host') ?? request.headers.get('host'),
    )

    if (hasPublicSupabaseEnv()) {
      const existingSessionClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {},
          },
        },
      )
      const {
        data: { user: existingUser },
      } = await existingSessionClient.auth.getUser()

      if (existingUser?.email && allowMockAuth && loginId === 'admin' && password === '7777') {
        return NextResponse.json(
          { error: 'Sign out of the current Supabase session before using local admin login' },
          { status: 409 },
        )
      }
    }

    if (allowMockAuth && loginId === 'admin' && password === '7777') {
      return createMockLoginResponse('admin@local.alphix', 'admin', 'Local Admin')
    }

    if (!email || !emailPattern.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!hasPublicSupabaseEnv()) {
      if (allowMockAuth) {
        return createMockLoginResponse(email, 'user', 'Mock Trader')
      }

      return NextResponse.json({ error: 'Authentication is unavailable' }, { status: 503 })
    }

    const response = NextResponse.json({ success: true, data: {} })
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

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 401 })
    }

    if (!data.user?.email) {
      return NextResponse.json({ error: 'Authenticated user is missing email' }, { status: 500 })
    }

    clearMockCookies(response)
    ensureExecutionRunning(data.user.email)

    const finalResponse = NextResponse.json({
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name:
            typeof data.user.user_metadata?.name === 'string'
              ? data.user.user_metadata.name
              : data.user.email,
          role: getUserRoleFromMetadata(data.user) ?? 'user',
        },
        accessToken: data.session?.access_token ?? null,
      },
    })

    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie)
    })

    return finalResponse
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
