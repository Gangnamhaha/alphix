import type { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { getUserRoleFromMetadata } from '@/lib/auth/roles'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ProfileUser {
  email: string
  name: string
  isMockSession: boolean
}

interface StoredUserProfile {
  name: string | null
  role: string | null
}

const mockCookieMaxAge = 60 * 60 * 24

function hasPublicSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function hasAdminSupabaseEnv() {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getDefaultMockName(role: string | undefined) {
  return role === 'admin' ? 'Local Admin' : 'Mock Trader'
}

function getUserNameFromMetadata(user: User) {
  if (!isRecord(user.user_metadata)) {
    return ''
  }

  return readTrimmedString(user.user_metadata.name)
}

async function getStoredUserProfile(email: string): Promise<StoredUserProfile | null> {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select('name, role')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function syncStoredUserProfile(email: string, name: string, fallbackRole: string) {
  const supabase = createAdminSupabaseClient()
  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('role')
    .eq('email', email)
    .maybeSingle()

  if (existingUserError) {
    throw new Error(existingUserError.message)
  }

  const { error } = await supabase.from('users').upsert(
    {
      email,
      name,
      role: existingUser?.role ?? fallbackRole,
    },
    { onConflict: 'email' },
  )

  if (error) {
    throw new Error(error.message)
  }
}

function buildProfileResponse(user: ProfileUser) {
  return NextResponse.json({
    success: true,
    data: {
      user,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const isMockSession = request.cookies.get('mock_session')?.value === 'active'

    if (isMockSession) {
      const email =
        readTrimmedString(request.cookies.get('mock_email')?.value).toLowerCase() ||
        'mock.user@alphix.kr'
      const role = request.cookies.get('mock_role')?.value
      const savedName = readTrimmedString(request.cookies.get('mock_name')?.value)

      return buildProfileResponse({
        email,
        name: savedName || getDefaultMockName(role),
        isMockSession: true,
      })
    }

    if (!hasPublicSupabaseEnv()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = user.email.trim().toLowerCase()
    const storedProfile = hasAdminSupabaseEnv() ? await getStoredUserProfile(email) : null
    const name = storedProfile?.name?.trim() || getUserNameFromMetadata(user)

    return buildProfileResponse({
      email,
      name,
      isMockSession: false,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const name = readTrimmedString(body.name)

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Name must be between 2 and 50 characters' },
        { status: 400 },
      )
    }

    const isMockSession = request.cookies.get('mock_session')?.value === 'active'

    if (isMockSession) {
      const email =
        readTrimmedString(request.cookies.get('mock_email')?.value).toLowerCase() ||
        'mock.user@alphix.kr'
      const response = buildProfileResponse({
        email,
        name,
        isMockSession: true,
      })

      response.cookies.set('mock_name', name, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: mockCookieMaxAge,
      })

      return response
    }

    if (!hasPublicSupabaseEnv()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = user.email.trim().toLowerCase()
    const { error } = await supabase.auth.updateUser({
      data: {
        name,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (hasAdminSupabaseEnv()) {
      await syncStoredUserProfile(email, name, getUserRoleFromMetadata(user) ?? 'user')
    }

    return buildProfileResponse({
      email,
      name,
      isMockSession: false,
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
