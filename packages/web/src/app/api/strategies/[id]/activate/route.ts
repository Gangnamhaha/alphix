import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Strategy id is required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        strategy: {
          id,
          isActive: true,
          activatedAt: new Date().toISOString(),
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
