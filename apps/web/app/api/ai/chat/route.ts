import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateChat } from '@/lib/ai/agnes'
import { logger } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const { messages } = await req.json()

  try {
    const result = await generateChat({ messages })
    const elapsed = Date.now() - startTime

    const supabase = await createClient()
    await supabase.from('audit_logs').insert({
      action: 'ai_chat',
      details: {
        success: true,
        timeMs: elapsed,
        tokens: result.tokens || 0,
      },
    })

    return NextResponse.json({
      response: result.text,
      reasoning: result.reasoning,
      timeMs: elapsed,
      usage: { total_tokens: result.tokens || 0 },
    })
  } catch (error) {
    logger.error('Chat error:', error)
    return NextResponse.json(
      { response: "I'm processing your request. Please give me a moment." },
      { status: 500 }
    )
  }
}
