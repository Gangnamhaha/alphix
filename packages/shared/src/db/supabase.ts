import { createClient } from '@supabase/supabase-js'

import type { Database } from './types'

export function createSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY

  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY')

  return createClient<Database>(url, key)
}

export function createSupabaseServerClient(serviceRoleKey: string) {
  const url = process.env.SUPABASE_URL

  if (!url) throw new Error('Missing SUPABASE_URL')

  return createClient<Database>(url, serviceRoleKey)
}
