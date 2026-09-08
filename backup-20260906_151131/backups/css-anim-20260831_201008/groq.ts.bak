import { ChatMessage, ChatOptions, ChatResponse } from './types'
import { ensureString } from '@/lib/utils/string'

const GROQ_BASE = 'https://api.groq.com/openai/v1'
const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function generateChatGroq(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set')

  const { temperature = 0.7, max_tokens = 2000 } = options

  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      max_tokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq chat failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return {
    content: ensureString(data.choices[0]?.message?.content, 'No response.'),
    tokens: typeof data.usage?.total_tokens === 'number' ? data.usage.total_tokens : 0,
    provider: 'groq',
  }
}
