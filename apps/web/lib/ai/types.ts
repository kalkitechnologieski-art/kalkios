export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  reasoning_content?: string
  tool_calls?: any[]
  tool_call_id?: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
  max_tokens?: number
  stream?: boolean
  deep?: boolean
  search?: boolean
  reasoning_effort?: 'low' | 'medium' | 'high' | 'max'
}

export interface ChatResponse {
  content: string
  reasoning?: string
  tokens: number
  timeMs?: number
  provider: string
  steps?: string[]
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
  date: string
}

export interface ImageGenerationOptions {
  prompt: string
  image?: string | File // can be base64 string or File
  size?: string
  ratio?: string
  negativePrompt?: string
  steps?: number
}

export interface VideoGenerationOptions {
  prompt: string
  image?: string | File
  duration?: number
  resolution?: string
  motion?: number
}

export interface Lead {
  id?: string
  name: string | null
  email: string | null
  phone: string | null
  company: string | null
  jobTitle: string | null
  linkedinUrl: string | null
  twitterUrl: string | null
  city: string | null
  country: string | null
  verified: boolean
  confidence: number
  source: string
}
