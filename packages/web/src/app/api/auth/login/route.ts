import { NextRequest, NextResponse } from 'next/server'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LoginBody {
  email?: string
  password?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody
    const email = body.email?.trim()
    const password = body.password?.trim()

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

    return response
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
