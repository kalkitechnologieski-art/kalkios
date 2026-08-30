import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'
import { validateAIEnv } from '@/lib/ai/check-env'

export async function POST(req: NextRequest) {
  try {
    validateAIEnv()
    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const result = await chat(messages)

    return NextResponse.json({
      response: result.content,
      reasoning: result.reasoning,
      usage: { total_tokens: result.tokens },
      provider: result.provider,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        response: `⚠️ Error: ${error.message || 'Unknown error'}`,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
