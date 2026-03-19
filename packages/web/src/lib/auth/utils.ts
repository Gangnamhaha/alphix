import { redirect } from 'next/navigation'

import { getUserRoleFromMetadata, isAdminRole } from './roles'
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
  const metadataRole = getUserRoleFromMetadata(user)

  if (isAdminRole(metadataRole)) {
    return user
  }

  redirect('/dashboard')
}
