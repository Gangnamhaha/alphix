import { cookies, headers } from 'next/headers'

import { isLocalAuthHost } from './mock-auth'

export interface MockSessionState {
  isAuthenticated: boolean
  role: 'admin' | 'user' | null
  email: string | null
  name: string | null
}

export async function getMockSessionState(): Promise<MockSessionState> {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const hostHeader = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const isAuthenticated =
    isLocalAuthHost(hostHeader) && cookieStore.get('mock_session')?.value === 'active'
  const roleValue = cookieStore.get('mock_role')?.value
  const email = cookieStore.get('mock_email')?.value ?? null
  const name = cookieStore.get('mock_name')?.value ?? null
  const role = roleValue === 'admin' || roleValue === 'user' ? roleValue : null

  return {
    isAuthenticated,
    role: isAuthenticated ? role : null,
    email: isAuthenticated ? email : null,
    name: isAuthenticated ? name : null,
  }
}
