'use client'

import type { User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'

import { createClient, hasPublicSupabaseEnv } from '@/lib/supabase/client'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

const AuthCtx = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasPublicSupabaseEnv()) {
      setLoading(false)
      return
    }

    let supabase

    try {
      supabase = createClient()
    } catch {
      setLoading(false)
      return
    }

    supabase.auth
      .getUser()
      .then(({ data }) => {
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthCtx.Provider value={{ user, loading }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
