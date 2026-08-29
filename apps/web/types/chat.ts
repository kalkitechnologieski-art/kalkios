export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  reasoning?: string | null
  tokens?: number
  timeMs?: number
  isThinking?: boolean
}
