import { NextRequest, NextResponse } from 'next/server'

import { stopExecution } from '@/lib/runtime/execution-session'

export async function POST(request: NextRequest) {
  try {
    const email = request.cookies.get('mock_email')?.value
    if (email) {
      stopExecution(email, 'logout')
    }

    const response = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    })

    response.cookies.set('mock_session', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    response.cookies.set('mock_role', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    response.cookies.set('mock_email', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
