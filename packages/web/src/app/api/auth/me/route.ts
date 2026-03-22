import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('mock_session')?.value
    const role = request.cookies.get('mock_role')?.value
    const email = request.cookies.get('mock_email')?.value
    const name = request.cookies.get('mock_name')?.value

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
