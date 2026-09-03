export interface Lead {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  website: string | null
  company: string | null
  jobTitle: string | null
  linkedinUrl: string | null
  twitterUrl: string | null
  city: string | null
  country: string | null
  verified: boolean
  confidence: number
  source: string
  rawData: Record<string, unknown> | null
  createdAt: Date
}

export interface LeadSearchSession {
  id: string
  query: string
  targetCount: number
  status: 'idle' | 'processing' | 'completed' | 'failed'
  leadsFound: number
  createdAt: Date
  completedAt: Date | null
}

export interface LeadSearchParams {
  query: string
  targetCount: number
}
