// == SIDDHI F1 ==
// Conversation CRUD: localStorage primary + Supabase best-effort sync.
// -----------------------------------------------------------------------------

import { createClient } from '@/lib/supabase/client';
import type { Conversation, ConversationMessage } from './types';
import { STORAGE_KEY, ACTIVE_CONVERSATION_KEY } from './types';

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function loadLocalConversations(): Conversation[] {
  if (typeof localStorage === 'undefined') return [];
  const list = safeParse<Conversation[]>(localStorage.getItem(STORAGE_KEY), []);
  return Array.isArray(list) ? list : [];
}

export function saveLocalConversations(list: Conversation[]): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* quota */ }
}

export function getActiveConversationId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
}

export function setActiveConversationId(id: string | null): void {
  if (typeof localStorage === 'undefined') return;
  if (id === null) localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  else localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
}

export function createConversation(): Conversation {
  const now = Date.now();
  return {
    id: uid(),
    title: 'New chat',
    autoTitled: false,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    preview: '',
    messages: [],
  };
}

export function findConversation(list: Conversation[], id: string): Conversation | null {
  return list.find((c) => c.id === id) ?? null;
}

export function upsertConversation(list: Conversation[], convo: Conversation): Conversation[] {
  const idx = list.findIndex((c) => c.id === convo.id);
  const next = [...list];
  if (idx >= 0) next[idx] = convo;
  else next.unshift(convo);
  next.sort((a, b) => b.updatedAt - a.updatedAt);
  return next;
}

export function deleteConversation(list: Conversation[], id: string): Conversation[] {
  return list.filter((c) => c.id !== id);
}

export function renameConversation(list: Conversation[], id: string, title: string): Conversation[] {
  return list.map((c) =>
    c.id === id
      ? { ...c, title: title.slice(0, 60), autoTitled: false, updatedAt: Date.now() }
      : c
  );
}

export function toConversationMessages(
  raw: Array<{
    id: string;
    role: string;
    content: string;
    reasoning?: string;
    traces?: Array<{ id?: string; type?: string; status?: string; message?: string; duration?: number }>;
    artifacts?: Array<{ type: string; language?: string; title: string; content: string }>;
    toolCalls?: Array<{ name: string; args: unknown; result: unknown }>;
  }>
): ConversationMessage[] {
  return raw.map((m) => ({
    id: m.id,
    role: (m.role === 'user' || m.role === 'assistant' || m.role === 'system' ? m.role : 'assistant'),
    content: m.content ?? '',
    reasoning: m.reasoning,
    traces: m.traces,
    artifacts: m.artifacts,
    toolCalls: m.toolCalls,
    createdAt: Date.now(),
  }));
}

export function computePreview(messages: ConversationMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const src = lastUser?.content ?? lastAssistant?.content ?? '';
  return src.slice(0, 80).replace(/\s+/g, ' ').trim();
}

export async function pushConversationToSupabase(convo: Conversation): Promise<void> {
  try {
    const supabase = createClient() as unknown as {
      auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
      from: (t: string) => { upsert: (row: unknown) => Promise<unknown> };
    };
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from('siddhi_conversations').upsert({
      id: convo.id,
      user_id: data.user.id,
      title: convo.title,
      auto_titled: convo.autoTitled,
      message_count: convo.messageCount,
      preview: convo.preview,
      messages: convo.messages,
      created_at: new Date(convo.createdAt).toISOString(),
      updated_at: new Date(convo.updatedAt).toISOString(),
    });
  } catch { /* silent */ }
}

export async function deleteConversationFromSupabase(id: string): Promise<void> {
  try {
    const supabase = createClient() as unknown as {
      from: (t: string) => { delete: () => { eq: (c: string, v: unknown) => Promise<unknown> } };
    };
    await supabase.from('siddhi_conversations').delete().eq('id', id);
  } catch { /* silent */ }
}
