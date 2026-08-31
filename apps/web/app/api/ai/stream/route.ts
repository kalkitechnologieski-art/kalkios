import { NextRequest } from 'next/server';
import { createParser, EventSourceMessage } from 'eventsource-parser';
import { EnterpriseRouter } from '@/lib/orchestration/enterprise-router';
import { EnhancedDeepThink } from '@/lib/reasoning/enhanced-deep-think';
import { EnhancedSETUAgent } from '@/lib/agents/setu/enhanced-agent';
import { EnhancedImageGenerator } from '@/lib/ai/enhanced/image';
import { EnhancedVideoGenerator } from '@/lib/ai/enhanced/video';
import { SIDDHI_SYSTEM_PROMPT } from '@/lib/prompts/siddhi-system';
import { generateCSV } from '@/lib/ai/enhanced/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    } catch (err) {
      console.error('[API] Failed to send event:', err);
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
      console.log('[API] 📨 Request received (Node.js)');
      const body = await req.json().catch(() => null);
      if (!body || !body.messages || !Array.isArray(body.messages)) {
        await send({ type: 'error', message: 'Invalid request.' });
        await writer.close();
        return;
      }

      const { messages, intent, options, userId, sessionId } = body;
      const lastUser = messages.filter((m: any) => m.role === 'user').pop();
      const query = lastUser?.content || '';
      const detectedIntent = intent || detectIntent(query);

      console.log(`[API] 🎯 Intent: ${detectedIntent}, query: "${query.slice(0, 50)}..."`);
      await send({ type: 'status', message: `Processing with ${detectedIntent}...` });

      // ─── Specialised intents ──────────────────────────────────────────
      if (detectedIntent === 'deep') {
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
        await writer.close();
        return;
      }

      if (detectedIntent === 'setu') {
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
        await writer.close();
        return;
      }

      if (detectedIntent === 'image') {
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
        await writer.close();
        return;
      }

      if (detectedIntent === 'video') {
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
        await writer.close();
        return;
      }

      // ─── Chat: use EnterpriseRouter ──────────────────────────────────
      console.log('[API] 🚀 Using EnterpriseRouter for chat...');
      const systemPrompt = `${SIDDHI_SYSTEM_PROMPT}\n\nUser query: ${query}`;
      const enrichedMessages = [{ role: 'system', content: systemPrompt }, ...messages];

      const router = new EnterpriseRouter();
      const stream = await router.route({
        messages: enrichedMessages,
        stream: true,
        userId,
        sessionId,
        deep: false,
        intent: 'chat',
      });

      if (stream instanceof ReadableStream) {
        console.log('[API] 📡 Streaming with eventsource‑parser...');
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let hasContent = false;
        let fullContent = '';
        let chunkCount = 0;

        // ─── Correct parser configuration ──────────────────────────────
        const parser = createParser({
          onEvent: (event: EventSourceMessage) => {
            if (event.data === '[DONE]') return;
            try {
              const parsed = JSON.parse(event.data);
              // OpenAI‑compatible: choices[0].delta.content
              const content = parsed?.choices?.[0]?.delta?.content ||
                              parsed?.choices?.[0]?.message?.content ||
                              parsed?.content;
              if (content) {
                const text = safeString(content);
                fullContent += text;
                hasContent = true;
                console.log(`[API] 📝 SSE chunk: "${text.slice(0, 50)}..."`);
                send({ type: 'content', content: text });
              }
              // Handle reasoning content
              const reasoning = parsed?.choices?.[0]?.delta?.reasoning_content;
              if (reasoning) {
                send({ type: 'reasoning', content: safeString(reasoning) });
              }
            } catch (e) {
              console.warn('[API] ⚠️ Failed to parse SSE event:', e);
            }
          },
        });

        // ─── Read stream ──────────────────────────────────────────────────
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunkCount++;
            const chunk = decoder.decode(value, { stream: true });
            console.log(`[API] 📦 Chunk ${chunkCount} (${chunk.length} bytes)`);
            parser.feed(chunk);
          }
        } catch (readErr) {
          console.error('[API] ❌ Stream read error:', readErr);
        }

        // ─── Fallback if no content ──────────────────────────────────────
        if (!hasContent) {
          console.warn('[API] ⚠️ No content from SSE. Falling back to non‑streaming.');
          const fallbackResult = await router.route({
            messages: enrichedMessages,
            stream: false,
            userId,
            sessionId,
            deep: false,
            intent: 'chat',
          });
          if (fallbackResult?.choices?.[0]?.message?.content) {
            const text = safeString(fallbackResult.choices[0].message.content);
            await send({ type: 'content', content: text });
          } else {
            await send({ type: 'content', content: 'I received your message but am having trouble responding. Please try again.' });
          }
        } else {
          console.log(`[API] ✅ Full content received (${fullContent.length} chars).`);
        }

        await send({ type: 'complete' });
        await writer.close();
      } else {
        // Router returned a plain object (non‑streaming)
        console.warn('[API] 📄 Router returned plain object (non‑streaming).');
        const content = stream?.choices?.[0]?.message?.content;
        if (content) {
          await send({ type: 'content', content: safeString(content) });
        } else {
          await send({ type: 'content', content: 'No response available.' });
        }
        await send({ type: 'complete' });
        await writer.close();
      }
    } catch (error: any) {
      console.error('[API] 💥 Unhandled error:', error);
      await send({ type: 'error', message: 'An error occurred. Please try again.' });
      await writer.close();
    }
  })();

  return response;
}
