const API_BASE = '/api'

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }

  return (await res.json()) as T
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  return parseResponse<T>(res)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return parseResponse<T>(res)
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return parseResponse<T>(res)
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' })
  return parseResponse<T>(res)
}
