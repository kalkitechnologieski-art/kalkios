import { ChatMessage, ChatOptions, ChatResponse } from './types'

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

export async function generateChatOpenRouter(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is not set')

  const { temperature = 0.7, max_tokens = 2000 } = options

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
      max_tokens,
    }),
  })

  if (!response.ok) throw new Error(`OpenRouter chat failed: ${response.status}`)

  const data = await response.json()
  return {
    content: data.choices[0]?.message?.content || '',
    tokens: data.usage?.total_tokens || 0,
    provider: 'openrouter',
  }
}
