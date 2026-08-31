import { NextRequest } from 'next/server';
import { StreamingOrchestrator } from '@/lib/orchestration/streaming-orchestrator';
import { EnhancedDeepThink } from '@/lib/reasoning/enhanced-deep-think';
import { EnhancedSETUAgent } from '@/lib/agents/setu/enhanced-agent';
import { EnhancedImageGenerator } from '@/lib/ai/enhanced/image';
import { EnhancedVideoGenerator } from '@/lib/ai/enhanced/video';
import { SIDDHI_SYSTEM_PROMPT } from '@/lib/prompts/siddhi-system';
import { generateCSV } from '@/lib/ai/enhanced/utils';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// ─── Safe string converter (handles React elements) ──────────────────────
function safeString(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as any;
    if (obj.props?.dangerouslySetInnerHTML?.__html) {
      return String(obj.props.dangerouslySetInnerHTML.__html);
    }
    if (obj.props?.children) {
      return safeString(obj.props.children);
    }
    try {
      return JSON.stringify(data);
    } catch {
      return '[object Object]';
    }
  }
  return String(data);
}

// ─── Intent detection ──────────────────────────────────────────────────────
function detectIntent(query: string): string {
  const lower = query.toLowerCase();
  if (/generate image|create image|draw|paint|render image|make an image/.test(lower)) return 'image';
  if (/generate video|create video|animate|make video|render video/.test(lower)) return 'video';
  if (/lead|prospect|find customers|generate leads|sales|b2b|find contacts/.test(lower)) return 'setu';
  if (/explain|analyze|why|how|what if|compare|detail|thorough|comprehensive/.test(lower) || query.length > 80) {
    return 'deep';
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
    } catch (e) {
      console.error('[send] Failed to write:', e);
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
      console.log('[API] Request received');
      const body = await req.json().catch((e) => {
        console.error('[API] Failed to parse JSON:', e);
        return null;
      });

      if (!body || !body.messages || !Array.isArray(body.messages)) {
        console.error('[API] Invalid request body');
        await send({ type: 'error', message: 'Invalid request.' });
        await writer.close();
        return;
      }

      const { messages, intent, options, userId, sessionId } = body;
      const lastUser = messages.filter((m: any) => m.role === 'user').pop();
      const query = lastUser?.content || '';
      const detectedIntent = intent || detectIntent(query);

      console.log(`[API] Detected intent: ${detectedIntent}, query: "${query.slice(0, 50)}..."`);

      await send({ type: 'status', message: `Processing with ${detectedIntent}...` });

      // ─── Specialised intents ──────────────────────────────────────────────
      if (detectedIntent === 'deep') {
        console.log('[API] Running DeepThink...');
        const deepThink = new EnhancedDeepThink();
        const result = await deepThink.reason(query, {
          num_paths: 3,
          consensus_threshold: 0.6,
          stream: false,
          useWeb: true,
        });
        await send({ type: 'reasoning', content: safeString(result.reasoning) });
        await send({ type: 'content', content: safeString(result.final_answer) });
        await send({ type: 'complete' });
        console.log('[API] DeepThink completed.');
        await writer.close();
        return;
      }

      if (detectedIntent === 'setu') {
        console.log('[API] Running SETU...');
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
        await send({ type: 'leads', leads: leadData, total: leads.length, csv });
        await send({ type: 'content', content: `Found ${leads.length} leads. Download CSV below.` });
        await send({ type: 'complete' });
        console.log('[API] SETU completed.');
        await writer.close();
        return;
      }

      if (detectedIntent === 'image') {
        console.log('[API] Running Image Generation...');
        const imageGen = new EnhancedImageGenerator();
        const result = await imageGen.generate({
          prompt: query,
          quality: options?.quality || 'standard',
          size: options?.size || '2K',
          ratio: options?.ratio || '16:9',
          cache: true,
        });
        await send({ type: 'image', url: result.url });
        await send({ type: 'content', content: `![Generated Image](${result.url})` });
        await send({ type: 'complete' });
        console.log('[API] Image completed.');
        await writer.close();
        return;
      }

      if (detectedIntent === 'video') {
        console.log('[API] Running Video Generation...');
        const videoGen = new EnhancedVideoGenerator();
        const result = await videoGen.generate({
          prompt: query,
          quality: options?.quality || 'balanced',
          resolution: options?.resolution || '720P',
          duration: options?.duration || 5,
          cache: true,
        });
        await send({ type: 'video', url: result.url });
        await send({ type: 'content', content: `<video src="${result.url}" controls style="max-width:100%;border-radius:12px;" />` });
        await send({ type: 'complete' });
        console.log('[API] Video completed.');
        await writer.close();
        return;
      }

      // ─── Default: chat with orchestrator ──────────────────────────────────
      console.log('[API] Using StreamingOrchestrator for chat...');
      const systemPrompt = `${SIDDHI_SYSTEM_PROMPT}\n\nUser query: ${query}`;
      const enrichedMessages = [{ role: 'system', content: systemPrompt }, ...messages];

      const orchestrator = new StreamingOrchestrator();
      const stream = await orchestrator.route({
        messages: enrichedMessages,
        stream: true,
        userId,
        sessionId,
        deep: false,
        intent: 'chat',
      });

      console.log('[API] Orchestrator returned:', stream ? 'ReadableStream' : 'null');

      if (stream instanceof ReadableStream) {
        const reader = stream.getReader();
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
                if (parsed.content) parsed.content = safeString(parsed.content);
                await send(parsed);
              } catch (e) {
                console.warn('[API] Failed to parse SSE chunk:', data, e);
                await send({ type: 'content', content: safeString(data) });
              }
            } else if (line.trim()) {
              await send({ type: 'content', content: safeString(line) });
            }
          }
        }
        await send({ type: 'complete' });
        console.log('[API] Stream finished.');
        await writer.close();
      } else {
        console.warn('[API] Orchestrator did not return a stream. Falling back to plain response.');
        await send({ type: 'content', content: safeString(stream?.choices?.[0]?.message?.content || 'No response.') });
        await send({ type: 'complete' });
        await writer.close();
      }
    } catch (error: any) {
      console.error('[API] Unhandled error:', error);
      await send({ type: 'error', message: 'An error occurred. Please try again.' });
      await writer.close();
    }
  })();

  return response;
}
