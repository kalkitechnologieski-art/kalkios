import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

// ── Provider configuration ──
const PROVIDERS = [
  {
    name: 'groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    timeout: 30000,
  },
  {
    name: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    key: process.env.OPENROUTER_API_KEY,
    model: 'openai/gpt-4o-mini',
    timeout: 30000,
  },
  {
    name: 'zhipu',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    key: process.env.ZHIPU_API_KEY,
    model: 'glm-4-flash',
    timeout: 30000,
  },
]

const FALLBACK_RESPONSES = [
  "I'm SIDDHI, your quantum concierge. How may I assist you today?",
  "The quantum pendulum is oscillating. What brings you to the Temple of Technology?",
  "I sense your query. Let me connect you to the infinite knowledge of KALKI OS.",
  "Welcome to the future. How can I elevate your business today?",
]

// ── Error reporting to admin ──
async function reportErrorToAdmin(error: Error, provider: string, context: Record<string, unknown>) {
  try {
    const supabase = await createClient()
    await supabase.from('audit_logs').insert({
      action: 'ai_chat_error',
      details: {
        provider,
        error: error.message,
        context,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (logError) {
    console.error('Failed to log error to admin panel:', logError)
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const { messages } = await req.json()

  try {
    // ── Cloud provider fallback ──
    const availableProviders = PROVIDERS.filter((p) => p.key)

    for (const provider of availableProviders) {
      try {
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.key}`,
            ...(provider.name === 'openrouter' ? { 'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com' } : {}),
          },
          body: JSON.stringify({
            model: provider.model,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            })),
            temperature: 0.7,
            max_tokens: 2000,
          }),
          signal: AbortSignal.timeout(provider.timeout),
        })

        if (!response.ok) {
          const errorText = await response.text()
          logger.warn(`Provider ${provider.name} returned ${response.status}: ${errorText}`)
          await reportErrorToAdmin(
            new Error(`Provider ${provider.name} failed: ${response.status}`),
            provider.name,
            { status: response.status, error: errorText }
          )
          continue
        }

        const data = await response.json()
        const responseContent = data.choices?.[0]?.message?.content || 'No response received.'

        // Log success
        const supabase = await createClient()
        await supabase.from('audit_logs').insert({
          action: 'ai_chat_cloud',
          details: {
            provider: provider.name,
            success: true,
            timeMs: Date.now() - startTime,
            usage: data.usage,
          },
        })

        return NextResponse.json({
          response: responseContent,
          provider: provider.name,
          usage: data.usage,
        })
      } catch (err) {
        logger.warn(`Provider ${provider.name} failed:`, err)
        await reportErrorToAdmin(err as Error, provider.name, { messages })
        continue
      }
    }

    // ── All providers failed – use fallback ──
    const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
    return NextResponse.json({
      response: fallback,
      provider: 'fallback',
      usage: { total_tokens: 0 },
    })
  } catch (error) {
    logger.error('AI chat error:', error)
    await reportErrorToAdmin(error as Error, 'all', { messages })

    return NextResponse.json(
      {
        response: '⚠️ Quantum link disrupted. Please re-initialize connection.',
        provider: 'error',
        usage: { total_tokens: 0 },
      },
      { status: 500 }
    )
  }
}
