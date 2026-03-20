import { cookies } from 'next/headers'

export interface MockSessionState {
  isAuthenticated: boolean
  role: 'admin' | 'user' | null
}

export async function getMockSessionState(): Promise<MockSessionState> {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.get('mock_session')?.value === 'active'
  const roleValue = cookieStore.get('mock_role')?.value
  const role = roleValue === 'admin' || roleValue === 'user' ? roleValue : null

  return {
    isAuthenticated,
    role,
  }
}
