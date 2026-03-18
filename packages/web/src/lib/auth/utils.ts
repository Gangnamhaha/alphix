import { redirect } from 'next/navigation'

import { createServerSupabaseClient } from '../supabase/server'

export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  const metadataRole = user.app_metadata?.role ?? user.user_metadata?.role

  if (metadataRole === 'admin') {
    return user
  }

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (data?.role !== 'admin') {
    redirect('/dashboard')
  }

  return user
}
