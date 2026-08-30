import { NextRequest } from "next/server";
import { IntelligentRouter } from "@/lib/orchestration/router";
import { ChainOfThought } from "@/lib/reasoning/chain-of-thought";
import { SETUAgent } from "@/lib/agents/setu/agent";
import { hasAnyProvider } from "@/lib/env/validation";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function detectIntent(messages: any[]): string {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const lower = lastMsg.toLowerCase();

  if (lower.includes('generate image') || lower.includes('create image') || lower.includes('draw')) return 'image';
  if (lower.includes('generate video') || lower.includes('create video') || lower.includes('animate')) return 'video';
  if (lower.includes('lead') || lower.includes('prospect') || lower.includes('find customers')) return 'setu';
  if (lower.includes('explain') || lower.includes('analyze') || lower.includes('why') || lower.includes('how') || lower.length > 30) {
    return 'deep';
  }
  return 'chat';
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  const response = new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });

  // Start async work immediately after returning response
  (async () => {
    try {
      const body = await req.json();
      const { messages, userId } = body;

      if (!messages || !Array.isArray(messages)) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Invalid request: messages array required.' })}\n\n`));
        await writer.close();
        return;
      }

      if (!hasAnyProvider()) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No AI provider configured. Please contact support.' })}\n\n`));
        await writer.close();
        return;
      }

      const intent = detectIntent(messages);

      // --- SETU ---
      if (intent === 'setu') {
        const lastMsg = messages[messages.length - 1]?.content || '';
        const agent = new SETUAgent(lastMsg);
        const questions = await agent.generateQuestions();

        if (questions.length > 0) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'questions', questions })}\n\n`));
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
          await writer.close();
          return;
        }

        const userMessages = messages.filter((m: any) => m.role === 'user');
        const answers = userMessages.slice(-questions.length).map((m: any) => m.content);
        if (answers.length === questions.length) {
          await agent.answerQuestions(answers);
          await agent.executeSearch();
          const leads = agent.getLeads();
          const csv = agent.getCSV();
          const summary = agent.getSummary();
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'leads', leads, csv, summary })}\n\n`));
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
          await writer.close();
          return;
        }

        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'setu_pending', message: 'Please answer the clarifying questions.', questions })}\n\n`));
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
        await writer.close();
        return;
      }

      // --- DEEP THINK ---
      if (intent === 'deep') {
        const lastMsg = messages[messages.length - 1]?.content || '';
        const cot = new ChainOfThought();
        const generator = await cot.generate(lastMsg, { stream: true, deep: true });

        try {
          for await (const chunk of generator) {
            // Skip empty content chunks
            if (chunk.type === 'content' && (!chunk.content || chunk.content === '')) continue;
            await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
        } catch (error) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'DeepThink failed' })}\n\n`));
        } finally {
          await writer.close();
        }
        return;
      }

      // --- IMAGE ---
      if (intent === 'image') {
        const lastMsg = messages[messages.length - 1]?.content || '';
        const router = new IntelligentRouter();
        const result = await router.route({
          messages: [{ role: 'user', content: `Generate image: ${lastMsg}` }],
          stream: false,
        });

        const imageUrl = result?.data?.[0]?.url || '';
        if (imageUrl) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: `![Generated Image](${imageUrl})` })}\n\n`));
        } else {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Image generation failed. Please try again.' })}\n\n`));
        }
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
        await writer.close();
        return;
      }

      // --- VIDEO ---
      if (intent === 'video') {
        const lastMsg = messages[messages.length - 1]?.content || '';
        const router = new IntelligentRouter();
        const result = await router.route({
          messages: [{ role: 'user', content: `Generate video: ${lastMsg}` }],
          stream: false,
        });

        const videoUrl = result?.video_result?.[0]?.url || '';
        if (videoUrl) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: `<video src="${videoUrl}" controls style="max-width:100%;border-radius:12px;"></video>` })}\n\n`));
        } else {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Video generation failed. Please try again.' })}\n\n`));
        }
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
        await writer.close();
        return;
      }

      // --- GENERAL CHAT ---
      const router = new IntelligentRouter();
      const result = await router.route({
        messages,
        stream: true,
        userId,
      });

      // Handle streaming response from router
      if (result instanceof ReadableStream) {
        const reader = result.getReader();
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
                const delta = parsed.choices?.[0]?.delta;
                if (delta?.content) {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`));
                }
                if (delta?.reasoning_content) {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'reasoning', content: delta.reasoning_content })}\n\n`));
                }
                if (parsed.usage) {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'usage', tokens: parsed.usage.total_tokens })}\n\n`));
                }
                if (parsed.provider) {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'provider', provider: parsed.provider })}\n\n`));
                }
              } catch (_) {}
            }
          }
        }
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
        await writer.close();
      } else {
        // Non-streaming fallback
        const content = result?.choices?.[0]?.message?.content || '';
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
        await writer.close();
      }
    } catch (error: any) {
      console.error('[ADMIN] Stream error:', error);
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'I encountered an issue. Please try again.' })}\n\n`));
        await writer.close();
      } catch (_) {}
    }
  })();

  return response;
}
