import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getUserRoleFromMetadata, isAdminRole } from '@/lib/auth/roles'

const protectedRoutes = [
  '/dashboard',
  '/settings',
  '/strategies',
  '/backtest',
  '/portfolio',
  '/history',
  '/monitoring',
]
const adminRoutes = ['/admin']
const authRoutes = ['/login', '/signup', '/forgot-password']

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const pathname = request.nextUrl.pathname

  if (!supabaseUrl || !supabaseAnonKey) {
    if (matchesRoute(pathname, protectedRoutes) || matchesRoute(pathname, adminRoutes)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && (matchesRoute(pathname, protectedRoutes) || matchesRoute(pathname, adminRoutes))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && matchesRoute(pathname, authRoutes)) {
    const role = getUserRoleFromMetadata(user)
    const destination = isAdminRole(role) ? '/admin' : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  if (user && matchesRoute(pathname, adminRoutes)) {
    const role = getUserRoleFromMetadata(user)

    if (!isAdminRole(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
