import { ChatMessage } from './types'

const MAX_CONTEXT_TOKENS = 4000
const SUMMARY_TRIGGER_LENGTH = 20 // messages count

// Simple token estimator (rough: 1 token ~ 4 chars)
function estimateTokens(messages: ChatMessage[]): number {
  const text = messages.map(m => m.content).join(' ')
  return Math.ceil(text.length / 4)
}

// Summarize conversation history
export async function summarizeConversation(messages: ChatMessage[]): Promise<string> {
  if (messages.length === 0) return ''
  // Take the first system message and the last few messages
  const system = messages.find(m => m.role === 'system')
  const recent = messages.slice(-6) // last 6 messages
  const text = recent.map(m => `${m.role}: ${m.content}`).join('\n')
  return `Previous conversation summary: ${text.slice(0, 500)}...` // truncate
}

// Build memory context for the next request
export async function buildMemoryContext(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<ChatMessage[]> {
  const totalTokens = estimateTokens(messages)
  const result: ChatMessage[] = []

  // Always include system prompt
  result.push({ role: 'system', content: systemPrompt })

  // If conversation is long, include a summary and recent messages
  if (totalTokens > MAX_CONTEXT_TOKENS) {
    const summary = await summarizeConversation(messages)
    result.push({ role: 'system', content: `Context summary: ${summary}` })
    // Include last 10 messages
    const lastTen = messages.slice(-10)
    result.push(...lastTen)
  } else {
    // Include all messages except system (already added)
    const nonSystem = messages.filter(m => m.role !== 'system')
    result.push(...nonSystem)
  }

  return result
}

// Store conversation in IndexedDB (already in useMemory hook)
// We'll enhance the hook to also store metadata (tokens, etc.)
