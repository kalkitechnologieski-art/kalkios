import { NextRequest, NextResponse } from 'next/server';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { ZhipuClient } from '@/lib/providers/zhipu/client';
import { OpenRouterClient } from '@/lib/providers/openrouter/client';
import { verifySession, isResponse, requireStaff } from '@/lib/security/api-guards';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

type Probe = { label: string; run: () => Promise<string> };

export async function GET(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;
  const forbidden = requireStaff(user);
  if (forbidden) return forbidden;

  const probes: Probe[] = [
    {
      label: 'agnes',
      run: async () => {
        const r = await new AgnesClient().chat({
          messages: [{ role: 'user', content: 'ping' }],
          model: 'agnes-2.0-flash',
          temperature: 0,
          max_tokens: 5,
        });
        return r?.choices?.[0]?.message?.content?.slice(0, 50) || 'OK';
      },
    },
    {
      label: 'groq',
      run: async () => {
        const r = await new GroqClient().chat({
          messages: [{ role: 'user', content: 'ping' }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0,
          max_tokens: 5,
        });
        return r?.choices?.[0]?.message?.content?.slice(0, 50) || 'OK';
      },
    },
    {
      label: 'zhipu',
      run: async () => {
        const r = await new ZhipuClient().webSearch({ search_query: 'ping', count: 1 });
        return (r as { search_result?: unknown[] })?.search_result?.length
          ? 'Found results'
          : 'No results';
      },
    },
    {
      label: 'openrouter',
      run: async () => {
        const r = await new OpenRouterClient().chat({
          messages: [{ role: 'user', content: 'ping' }],
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          temperature: 0,
          max_tokens: 5,
        });
        return r?.choices?.[0]?.message?.content?.slice(0, 50) || 'OK';
      },
    },
  ];

  const results: Record<string, { status: string; message: string }> = {};
  await Promise.all(
    probes.map(async ({ label, run }) => {
      try {
        results[label] = { status: 'healthy', message: await run() };
      } catch (e) {
        results[label] = {
          status: 'unhealthy',
          message: e instanceof Error ? e.message.slice(0, 200) : 'unknown error',
        };
      }
    })
  );

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    providers: results,
  });
}
