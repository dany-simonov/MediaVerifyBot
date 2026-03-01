import type { Check, UserStats } from '../types'

// Empty base = relative URLs, proxied by Vite dev-server to localhost:8000
const API_BASE = ''
const API_SECRET = import.meta.env.VITE_API_SECRET_KEY || 'mediaverifybot_secret_key_2024'

export async function getUserStats(userId: number): Promise<UserStats> {
  const res = await fetch(`${API_BASE}/user/${userId}/stats`, {
    headers: { 'x-api-secret': API_SECRET },
  })
  if (!res.ok) {
    throw new Error('Failed to fetch user stats')
  }
  return res.json()
}

export async function getUserChecks(userId: number, limit = 10): Promise<Check[]> {
  const res = await fetch(`${API_BASE}/user/${userId}/checks?limit=${limit}`, {
    headers: { 'x-api-secret': API_SECRET },
  })
  if (!res.ok) {
    throw new Error('Failed to fetch user checks')
  }
  return res.json()
}
