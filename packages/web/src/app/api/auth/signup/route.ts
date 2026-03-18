import { NextRequest, NextResponse } from 'next/server'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface SignupBody {
  email?: string
  password?: string
  name?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupBody
    const email = body.email?.trim()
    const password = body.password?.trim()
    const name = body.name?.trim()

    if (!email || !emailPattern.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!name || name.length < 2 || name.length > 50) {
      return NextResponse.json({ error: 'Name must be between 2 and 50 characters' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: `user_${Date.now()}`,
          email,
          name,
          createdAt: new Date().toISOString(),
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
