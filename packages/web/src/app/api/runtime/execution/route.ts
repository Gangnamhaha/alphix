import { NextRequest, NextResponse } from 'next/server'

import {
  ensureExecutionRunning,
  getExecutionState,
  stopExecution,
} from '@/lib/runtime/execution-session'

interface ExecutionBody {
  userKey?: string
  action?: 'ensure' | 'stop'
}

function normalizeUserKey(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

export async function GET(request: NextRequest) {
  try {
    const userKey = normalizeUserKey(request.nextUrl.searchParams.get('userKey'))
    if (!userKey) {
      return NextResponse.json({ error: 'userKey is required' }, { status: 400 })
    }

    const state = getExecutionState(userKey)
    return NextResponse.json({
      success: true,
      data: {
        state,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExecutionBody
    const userKey = normalizeUserKey(body.userKey)

    if (!userKey) {
      return NextResponse.json({ error: 'userKey is required' }, { status: 400 })
    }

    const action = body.action ?? 'ensure'
    const state =
      action === 'stop' ? stopExecution(userKey, 'logout') : ensureExecutionRunning(userKey)

    return NextResponse.json({
      success: true,
      data: {
        state,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
