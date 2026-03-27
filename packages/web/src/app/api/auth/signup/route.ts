import { randomUUID } from 'crypto'

import { NextRequest, NextResponse } from 'next/server'

import { createAdminSupabaseClient } from '@/lib/supabase/admin'

interface SignupBody {
  email?: string
  password?: string
  name?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SUPABASE_AUTH_SENTINEL = '$supabase_auth$'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupBody
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const name = body.name?.trim() ?? null

    if (!email || !emailPattern.test(email)) {
      return NextResponse.json({ error: '유효한 이메일을 입력해 주세요.' }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 })
    }

    let admin

    try {
      admin = createAdminSupabaseClient()
    } catch {
      return NextResponse.json(
        { error: '회원가입을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 503 },
      )
    }

    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    if (createError) {
      if (
        createError.message.toLowerCase().includes('already registered') ||
        createError.message.toLowerCase().includes('already been registered') ||
        createError.message.toLowerCase().includes('duplicate')
      ) {
        return NextResponse.json(
          { error: '이미 가입된 이메일입니다. 로그인해 주세요.' },
          { status: 409 },
        )
      }

      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: '회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 500 },
      )
    }

    const { error: insertError } = await admin.from('users').insert({
      id: randomUUID(),
      email,
      name,
      password_hash: SUPABASE_AUTH_SENTINEL,
    })

    if (insertError && insertError.code !== '23505') {
      await admin.auth.admin.deleteUser(authData.user.id).catch(() => undefined)

      return NextResponse.json(
        { error: '프로필 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: '회원가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    )
  }
}
