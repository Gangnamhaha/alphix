import { NextRequest, NextResponse } from 'next/server'

interface UpdateStrategyBody {
  name?: string
  symbol?: string
  riskLevel?: 'low' | 'medium' | 'high'
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as UpdateStrategyBody

    if (!id) {
      return NextResponse.json({ error: 'Strategy id is required' }, { status: 400 })
    }

    if (!body.name && !body.symbol && !body.riskLevel) {
      return NextResponse.json({ error: 'At least one update field is required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        strategy: {
          id,
          name: body.name ?? 'Updated Strategy',
          symbol: body.symbol?.toUpperCase() ?? '005930',
          riskLevel: body.riskLevel ?? 'medium',
          updatedAt: new Date().toISOString(),
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
          deleted: true,
          deletedAt: new Date().toISOString(),
        },
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
