import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { QuantumPendulum } from '@/lib/ai/quantum-pendulum'
import { logger } from '@/lib/utils/logger'

const providers = [
  {
    name: 'groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    vision: true,
  },
  {
    name: 'openrouter',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    key: process.env.OPENROUTER_API_KEY,
    vision: true,
  },
]

const FALLBACK_RESPONSES = [
  "I'm Siddhi, your quantum concierge. How may I assist you today?",
  "The quantum pendulum is oscillating. What brings you to the Temple of Technology?",
  "I sense your query. Let me connect you to the infinite knowledge of KALKI OS.",
  "Welcome to the future. How can I elevate your business today?",
]

export async function POST(req: NextRequest) {
  try {
    const { messages, attachments } = await req.json()
    const pendulum = new QuantumPendulum()
    const params = pendulum.getModelParams()

    const availableProviders = providers.filter(p => p.key)
    
    if (availableProviders.length === 0) {
      const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
      return NextResponse.json({
        response: fallback,
        provider: 'fallback',
        usage: { total_tokens: 0 },
      })
    }

    const lastMessage = messages[messages.length - 1]
    const content: any[] = []

    if (lastMessage?.content) {
      content.push({ type: 'text', text: lastMessage.content })
    }

    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        if (att.type === 'image' && att.url) {
          content.push({
            type: 'image_url',
            image_url: { url: att.url },
          })
        }
      }
    }

    const modelMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.role === 'user' && content.length > 1 ? content : m.content,
    }))

    for (const provider of availableProviders) {
      try {
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.key}`,
          },
          body: JSON.stringify({
            model: provider.name === 'groq' ? 'llama-3.3-70b-versatile' : 'openai/gpt-4o-mini',
            messages: modelMessages,
            temperature: params.temperature,
            top_p: params.topP,
            frequency_penalty: params.frequencyPenalty,
            max_tokens: 2000,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          logger.warn(`Provider ${provider.name} returned ${response.status}: ${errorText}`)
          continue
        }

        const data = await response.json()
        const responseContent = data.choices?.[0]?.message?.content || 'No response received.'

        const supabase = await createClient()
        await supabase.from('audit_logs').insert({
          action: 'ai_chat',
          details: {
            provider: provider.name,
            success: true,
            attachments: attachments?.length || 0,
          },
        })

        return NextResponse.json({
          response: responseContent,
          provider: provider.name,
          usage: data.usage,
        })
      } catch (err) {
        logger.warn(`Provider ${provider.name} failed`, err)
        continue
      }
    }

    // All providers failed — return fallback
    const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
    return NextResponse.json({
      response: fallback,
      provider: 'fallback',
      usage: { total_tokens: 0 },
    })
  } catch (error) {
    logger.error('AI chat error', error)
    return NextResponse.json({
      response: '⚠️ Quantum link disrupted. Please re-initialize connection.',
      provider: 'error',
      usage: { total_tokens: 0 },
    })
  }
}
