import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('mock_session')

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: 'user_mock_001',
          email: 'mock.user@alphix.kr',
          name: 'Mock Trader',
          role: 'user',
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
