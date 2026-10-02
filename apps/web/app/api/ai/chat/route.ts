import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'
import { validateAIEnv } from '@/lib/ai/check-env'
import { verifySession, isResponse, rateLimit } from '@/lib/security/api-guards'

export const maxDuration = 120

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(req: NextRequest) {
  const user = await verifySession(req)
  if (isResponse(user)) return user

  const limit = rateLimit(`ai-chat:${user.id}`, 30, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    )
  }

  try {
    validateAIEnv()

    const body = (await req.json()) as { messages?: unknown }
    const messages = body.messages
    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 50 ||
      !messages.every(
        (m) =>
          typeof m === 'object' &&
          m !== null &&
          typeof (m as ChatMessage).content === 'string' &&
          ['user', 'assistant', 'system'].includes((m as ChatMessage).role)
      )
    ) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const result = await chat(messages as ChatMessage[])

    return NextResponse.json({
      response: result.content,
      reasoning: result.reasoning,
      usage: { total_tokens: result.tokens },
      provider: result.provider,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { response: 'Something went wrong on our side. Please try again.', error: 'chat_failed' },
      { status: 500 }
    )
  }
}
