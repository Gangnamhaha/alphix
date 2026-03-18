import { NextRequest, NextResponse } from 'next/server'

interface ProfileBody {
  name?: string
  bio?: string
  phone?: string
}

export async function PATCH(request: NextRequest) {
  try {
    const session = request.cookies.get('mock_session')

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as ProfileBody
    const name = body.name?.trim()
    const bio = body.bio?.trim()
    const phone = body.phone?.trim()

    if (!name && !bio && !phone) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 })
    }

    if (name && (name.length < 2 || name.length > 50)) {
      return NextResponse.json({ error: 'Name must be between 2 and 50 characters' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: 'user_mock_001',
          email: 'mock.user@alphix.kr',
          name: name ?? 'Mock Trader',
          bio: bio ?? '자동매매를 공부하는 트레이더',
          phone: phone ?? '010-0000-0000',
          updatedAt: new Date().toISOString(),
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
