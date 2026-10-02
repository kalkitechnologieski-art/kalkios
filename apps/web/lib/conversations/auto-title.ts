// == SIDDHI F1 ==
// Auto-title generation via /api/ai/stream with heuristic fallback.
// -----------------------------------------------------------------------------

import { MAX_TITLE_LENGTH } from './types';

export interface TitleSource {
  userMessage: string;
  assistantReply: string;
}

export async function generateConversationTitle(
  source: TitleSource
): Promise<{ title: string; autoTitled: boolean }> {
  const fallback = heuristicTitle(source.userMessage);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You generate 3-6 word conversation titles. ' +
              'Reply with ONLY the title — no quotes, no punctuation at the end, ' +
              'no explanation, no prefixes like "Title:". Use title case.',
          },
          {
            role: 'user',
            content:
              'User said: ' + source.userMessage.slice(0, 300) + '\n' +
              'Siddhi replied: ' + source.assistantReply.slice(0, 300) + '\n\n' +
              'Generate the title.',
          },
        ],
        sessionId: 'auto-title',
        deep: false, search: false, image: false, video: false,
        preferSpeed: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok || !response.body) return { title: fallback, autoTitled: false };

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';
    let safety = 0;

    while (safety < 200) {
      safety++;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') break;
        try {
          const evt = JSON.parse(payload) as { type?: string; content?: string };
          if (evt.type === 'content' && typeof evt.content === 'string') {
            content = evt.content;
            safety = 9999;
            break;
          }
        } catch { /* skip */ }
      }
    }

    try { reader.cancel(); } catch { /* ignore */ }

    const cleaned = cleanTitle(content);
    if (cleaned.length >= 3 && cleaned.length <= MAX_TITLE_LENGTH) {
      return { title: cleaned, autoTitled: true };
    }
    return { title: fallback, autoTitled: false };
  } catch {
    return { title: fallback, autoTitled: false };
  }
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/^title\s*:\s*/i, '')
    .replace(/[.!?]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TITLE_LENGTH);
}

function heuristicTitle(userMessage: string): string {
  const cleaned = userMessage.replace(/^[^\w]+/, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New chat';
  const clauses = cleaned.split(/[.!?\n]/);
  const first = (clauses[0] ?? cleaned).slice(0, 50).trim();
  if (first.length < 3) return cleaned.slice(0, 40) || 'New chat';
  return first.charAt(0).toUpperCase() + first.slice(1);
}
