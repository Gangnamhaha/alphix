import type { User } from '@supabase/supabase-js'

export function getUserRoleFromMetadata(user: User | null): string | null {
  if (!user) {
    return null
  }

  const role = user.app_metadata?.role
  return typeof role === 'string' ? role : null
}

export function isAdminRole(role: string | null) {
  return role === 'admin'
}
