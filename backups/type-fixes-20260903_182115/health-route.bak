import { NextRequest, NextResponse } from 'next/server';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { ZhipuClient } from '@/lib/providers/zhipu/client';
import { OpenRouterClient } from '@/lib/providers/openrouter/client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const results: Record<string, { status: string; message: string; error?: string }> = {};

  // Test Agnes
  try {
    const agnes = new AgnesClient();
    const response = await agnes.chat({
      messages: [{ role: 'user', content: 'ping' }],
      model: 'agnes-2.0-flash',
      temperature: 0,
      max_tokens: 5,
    });
    results['agnes'] = {
      status: 'healthy',
      message: response?.choices?.[0]?.message?.content?.slice(0, 50) || 'OK',
    };
  } catch (e: any) {
    results['agnes'] = { status: 'unhealthy', message: e.message, error: e.stack };
  }

  // Test Groq
  try {
    const groq = new GroqClient();
    const response = await groq.chat({
      messages: [{ role: 'user', content: 'ping' }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 5,
    });
    results['groq'] = {
      status: 'healthy',
      message: response?.choices?.[0]?.message?.content?.slice(0, 50) || 'OK',
    };
  } catch (e: any) {
    results['groq'] = { status: 'unhealthy', message: e.message, error: e.stack };
  }

  // Test Zhipu (web search)
  try {
    const zhipu = new ZhipuClient();
    const response = await zhipu.webSearch({ search_query: 'ping', count: 1 });
    results['zhipu'] = {
      status: 'healthy',
      message: response?.search_result?.length ? 'Found results' : 'No results',
    };
  } catch (e: any) {
    results['zhipu'] = { status: 'unhealthy', message: e.message, error: e.stack };
  }

  // Test OpenRouter
  try {
    const or = new OpenRouterClient();
    const response = await or.chat({
      messages: [{ role: 'user', content: 'ping' }],
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      temperature: 0,
      max_tokens: 5,
    });
    results['openrouter'] = {
      status: 'healthy',
      message: response?.choices?.[0]?.message?.content?.slice(0, 50) || 'OK',
    };
  } catch (e: any) {
    results['openrouter'] = { status: 'unhealthy', message: e.message, error: e.stack };
  }

  // Environment summary
  const env = {
    AGNES_API_KEY: process.env.AGNES_API_KEY ? 'present' : 'missing',
    GROQ_API_KEY: process.env.GROQ_API_KEY ? 'present' : 'missing',
    ZHIPU_API_KEY: process.env.ZHIPU_API_KEY ? 'present' : 'missing',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'present' : 'missing',
  };

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: env,
    providers: results,
  });
}
