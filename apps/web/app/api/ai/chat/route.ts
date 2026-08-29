import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    const result = await chat(messages)

    return NextResponse.json({
      response: result.content,
      reasoning: result.reasoning,
      usage: { total_tokens: result.tokens },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { response: "I'm having trouble connecting. Please try again." },
      { status: 500 }
    )
  }
}
