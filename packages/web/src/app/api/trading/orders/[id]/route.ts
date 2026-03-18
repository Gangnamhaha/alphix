import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Order id is required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          id,
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
