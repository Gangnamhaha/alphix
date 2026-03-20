import { redirect } from 'next/navigation'

import { getMockSessionState } from './mock-session'
import { getUserRoleFromMetadata, isAdminRole } from './roles'
import { createServerSupabaseClient } from '../supabase/server'

function hasSupabaseClientEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function getUser() {
  if (!hasSupabaseClientEnv()) {
    return null
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireAuth() {
  const mockSession = await getMockSessionState()

  if (mockSession.isAuthenticated) {
    return null
  }

  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function requireAdmin() {
  const mockSession = await getMockSessionState()

  if (mockSession.isAuthenticated) {
    if (mockSession.role === 'admin') {
      return null
    }

    redirect('/dashboard')
  }

  const user = await requireAuth()

  if (!user) {
    redirect('/login')
  }

  const metadataRole = getUserRoleFromMetadata(user)

  if (isAdminRole(metadataRole)) {
    return user
  }

  redirect('/dashboard')
}
