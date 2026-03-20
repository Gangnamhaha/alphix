import { NextRequest, NextResponse } from 'next/server'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LoginBody {
  identifier?: string
  email?: string
  password?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody
    const identifier = body.identifier?.trim()
    const email = body.email?.trim()
    const password = body.password?.trim()
    const loginId = identifier ?? email

    if (loginId === 'admin' && password === '7777') {
      const response = NextResponse.json({
        success: true,
        data: {
          user: {
            id: 'user_mock_admin',
            email: 'admin@local.alphix',
            name: 'Local Admin',
            role: 'admin',
          },
          accessToken: 'mock_access_token_admin',
        },
      })

      response.cookies.set('mock_session', 'active', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      })

      response.cookies.set('mock_role', 'admin', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      })

      return response
    }

    if (!email || !emailPattern.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: 'user_mock_001',
          email,
          name: 'Mock Trader',
          role: 'user',
        },
        accessToken: 'mock_access_token',
      },
    })

    response.cookies.set('mock_session', 'active', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    response.cookies.set('mock_role', 'user', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
