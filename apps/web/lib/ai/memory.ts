// ═══ SIDDHI v4.0 BATCH 1 ═══
// Hierarchical memory with token-budget-aware context building.
// ─────────────────────────────────────────────────────────────────────────────

import type { ChatMessage } from './types';

export interface HierarchicalMemory {
  shortTerm: ChatMessage[];
  mediumTerm: ChatMessage[];
  longTerm: Array<{ summary: string; timestamp: number; topics: string[] }>;
}

const estimateTokens = (msgs: ChatMessage[]): number =>
  msgs.reduce((sum, m) => sum + Math.ceil((m.content?.length ?? 0) / 4), 0);

export async function summarizeConversation(messages: ChatMessage[]): Promise<string> {
  if (messages.length === 0) return '';
  const text = messages.map((m) => `${m.role}: ${m.content.slice(0, 300)}`).join('\n');
  try {
    const { chat } = await import('./index');
    const result = await chat(
      [
        { role: 'system', content: 'Summarize this conversation in 3-5 bullets. Preserve key facts, decisions, and user preferences.' },
        { role: 'user', content: text },
      ],
      { max_tokens: 300 }
    );
    return result.content;
  } catch {
    return messages.slice(0, 5).map((m) => `${m.role}: ${m.content.slice(0, 100)}`).join('\n');
  }
}

export async function buildHierarchicalContext(
  messages: ChatMessage[],
  systemPrompt: string,
  maxTokens = 8000
): Promise<ChatMessage[]> {
  const result: ChatMessage[] = [{ role: 'system', content: systemPrompt }];
  let remaining = maxTokens - estimateTokens(result);

  for (const m of messages.slice(-10)) {
    const t = Math.ceil((m.content?.length ?? 0) / 4);
    if (t < remaining) { result.push(m); remaining -= t; }
  }

  if (messages.length > 10 && remaining > 500) {
    const summary = await summarizeConversation(messages.slice(0, -10));
    const msg: ChatMessage = { role: 'system', content: `[Earlier context]\n${summary}` };
    const t = Math.ceil(msg.content.length / 4);
    if (t < remaining) { result.push(msg); remaining -= t; }
  }

  return result;
}

export async function buildMemoryContext(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<ChatMessage[]> {
  return buildHierarchicalContext(messages, systemPrompt);
}
