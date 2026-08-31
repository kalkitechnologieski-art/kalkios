import { NextRequest } from 'next/server';
import { IntelligentRouter } from '@/lib/orchestration/router';
import { EnhancedDeepThink } from '@/lib/reasoning/enhanced-deep-think';
import { EnhancedSETUAgent } from '@/lib/agents/setu/enhanced-agent';
import { EnhancedImageGenerator } from '@/lib/ai/enhanced/image';
import { EnhancedVideoGenerator } from '@/lib/ai/enhanced/video';
import { SIDDHI_SYSTEM_PROMPT } from '@/lib/prompts/siddhi-system';
import { generateCSV } from '@/lib/ai/enhanced/utils';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function safeContent(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as any;
    if (obj.props?.dangerouslySetInnerHTML?.__html) {
      return String(obj.props.dangerouslySetInnerHTML.__html);
    }
    if (obj.props?.children) {
      return String(obj.props.children);
    }
    try {
      return JSON.stringify(data);
    } catch {
      return '[object Object]';
    }
  }
  return String(data);
}

function detectIntent(query: string): string {
  const lower = query.toLowerCase();
  if (/generate image|create image|draw|paint|render image|make an image/.test(lower)) return 'generate_image';
  if (/generate video|create video|animate|make video|render video/.test(lower)) return 'generate_video';
  if (/lead|prospect|find customers|generate leads|sales|b2b|find contacts/.test(lower)) return 'setu';
  if (/explain|analyze|why|how|what if|compare|detail|thorough|comprehensive/.test(lower) || query.length > 80) {
    return 'deep_think';
  }
  return 'chat';
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  const send = async (data: any) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      // writer closed
    }
  };

  const response = new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });

  (async () => {
    try {
      const body = await req.json().catch(() => null);
      if (!body || !body.messages || !Array.isArray(body.messages)) {
        await send({ type: 'error', message: 'Invalid request: messages array required.' });
        await writer.close();
        return;
      }

      const { messages, intent, options, userId, sessionId } = body;
      const lastUser = messages.filter((m: any) => m.role === 'user').pop();
      const query = lastUser?.content || '';
      const detectedIntent = intent || detectIntent(query);

      await send({ type: 'status', message: `Processing with ${detectedIntent}...` });

      let result: any;

      switch (detectedIntent) {
        case 'deep_think': {
          const deepThink = new EnhancedDeepThink();
          const reasoningResult = await deepThink.reason(query, {
            num_paths: 3,
            consensus_threshold: 0.6,
            stream: false,
            useWeb: true,
          });
          await send({
            type: 'reasoning',
            content: reasoningResult.reasoning,
            paths: reasoningResult.paths.map((p: any) => ({
              provider: p.provider,
              confidence: p.confidence,
              summary: p.summary,
            })),
            consensus: reasoningResult.consensus_score,
          });
          result = { content: reasoningResult.final_answer, provider: reasoningResult.provider };
          break;
        }
        case 'setu': {
          const setu = new EnhancedSETUAgent();
          const leads = await setu.generateLeads(query);
          const leadData = leads.map((l: any) => ({
            name: l.name,
            email: l.email,
            phone: l.phone,
            company: l.company,
            job_title: l.job_title,
            linkedin: l.linkedin_url,
            confidence: `${Math.round(l.confidence * 100)}%`,
          }));
          const csv = generateCSV(
            leadData,
            ['Name', 'Email', 'Phone', 'Company', 'Job Title', 'LinkedIn', 'Confidence'],
            {
              Name: 'name',
              Email: 'email',
              Phone: 'phone',
              Company: 'company',
              'Job Title': 'job_title',
              LinkedIn: 'linkedin',
              Confidence: 'confidence',
            }
          );
          await send({
            type: 'leads',
            leads: leadData,
            total: leads.length,
            csv,
          });
          result = { content: `Found ${leads.length} leads. Download CSV below.`, provider: 'setu' };
          break;
        }
        case 'generate_image': {
          const imageGen = new EnhancedImageGenerator();
          const imageResult = await imageGen.generate({
            prompt: query,
            quality: options?.quality || 'standard',
            size: options?.size || '2K',
            ratio: options?.ratio || '16:9',
            cache: true,
          });
          await send({
            type: 'image',
            url: imageResult.url,
            quality: imageResult.quality,
            size: imageResult.size,
            cache_hit: imageResult.cache_hit,
            time_ms: imageResult.time_ms,
          });
          result = { content: `![Generated Image](${imageResult.url})`, provider: 'image' };
          break;
        }
        case 'generate_video': {
          const videoGen = new EnhancedVideoGenerator();
          const videoResult = await videoGen.generate({
            prompt: query,
            quality: options?.quality || 'balanced',
            resolution: options?.resolution || '720P',
            duration: options?.duration || 5,
            cache: true,
          });
          await send({
            type: 'video',
            url: videoResult.url,
            quality: videoResult.quality,
            resolution: videoResult.resolution,
            duration: videoResult.duration,
            provider: videoResult.provider,
            time_ms: videoResult.time_ms,
          });
          result = { content: `<video src="${videoResult.url}" controls style="max-width:100%;border-radius:12px;" />`, provider: 'video' };
          break;
        }
        default: {
          const systemPrompt = `${SIDDHI_SYSTEM_PROMPT}\n\nUser query: ${query}`;
          const enrichedMessages = [{ role: 'system', content: systemPrompt }, ...messages];

          const router = new IntelligentRouter();
          const routerResult = await router.route({
            messages: enrichedMessages,
            stream: true,
            userId,
            sessionId: sessionId || userId,
          });

          if (routerResult instanceof ReadableStream) {
            const reader = routerResult.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) parsed.content = safeContent(parsed.content);
                    await send(parsed);
                  } catch {
                    await send({ type: 'content', content: safeContent(data) });
                  }
                } else if (line.trim()) {
                  await send({ type: 'content', content: safeContent(line) });
                }
              }
            }
            await send({ type: 'complete' });
            await writer.close();
            return;
          }
          result = routerResult;
        }
      }

      if (result?.content) {
        await send({
          type: 'content',
          content: safeContent(result.content),
          provider: result.provider,
        });
      }

      await send({ type: 'complete' });
      await writer.close();
    } catch (error: any) {
      console.error('[API] Stream error:', error);
      await send({
        type: 'error',
        message: 'An error occurred. Please try again.',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
      });
      await writer.close();
    }
  })();

  return response;
}
