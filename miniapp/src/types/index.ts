export type Verdict = 'REAL' | 'FAKE' | 'UNCERTAIN'
export type MediaType = 'image' | 'audio' | 'video' | 'text'

export interface Check {
  id: string
  media_type: MediaType
  verdict: Verdict
  confidence: number
  model_used: string
  explanation: string
  processing_ms: number
  created_at: string
}

export interface UserStats {
  user_id: number
  is_premium: boolean
  checks_today: number
  daily_limit: number
  total_checks: number
  created_at: string
}
