// ═══ SIDDHI v4.0 BATCH 2 v3.4 ═══
// FIXED: ChatTrace type — no more union indexing errors.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ChatArtifact {
  type: 'react' | 'html' | 'svg' | 'markdown' | 'code';
  language?: string;
  title: string;
  content: string;
}

export interface ChatToolCall {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

// FIXED: explicit trace type (was causing TS2537 index signature error)
export interface ChatTrace {
  id?: string;
  type?: string;
  status?: string;
  message?: string;
  duration?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
  tokens?: number;
  provider?: string;
  traces?: ChatTrace[];
  leads?: Array<{ name: string; email: string; company: string; confidence: number }>;
  csv?: string;
  questions?: string[];
  critique?: { issues: string[]; confidence: number; shouldRefine: boolean };
  plan?: { providers: string[]; useSearch: boolean; useTools: string[]; depth: string };
  artifacts?: ChatArtifact[];
  toolCalls?: ChatToolCall[];
  progress?: number;
  progressMessage?: string;
}

interface QueueStatus {
  pending: number;
  active: number;
  completed: number;
  failed: number;
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'default';
  let id = localStorage.getItem('siddhi_session_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('siddhi_session_id', id);
  }
  return id;
}

function uid(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useStreamingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ pending: 0, active: 0, completed: 0, failed: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesRef = useRef<ChatMessage[]>(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const sendMessage = useCallback(async (
    content: string,
    options: { deep?: boolean; setu?: boolean; search?: boolean; image?: boolean; video?: boolean; sessionId?: string } = {}
  ) => {
    setError(null);
    const userMsg: ChatMessage = { id: uid('u'), role: 'user', content, isStreaming: false };
    setMessages((prev) => [...prev, userMsg]);

    const assistantMsg: ChatMessage = {
      id: uid('a'),
      role: 'assistant',
      content: '',
      reasoning: '',
      isStreaming: true,
      traces: [],
      artifacts: [],
      toolCalls: [],
    };
    setMessages((prev) => [...prev, assistantMsg]);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    const sessionId = options.sessionId ?? getOrCreateSessionId();

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messagesRef.current, userMsg],
          sessionId,
          deep: options.deep ?? true,
          setu: options.setu || false,
          search: options.search ?? true,
          image: options.image || false,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as { type: string; [k: string]: unknown };

            if (parsed.type === 'error' && typeof parsed.message === 'string') {
              setError(parsed.message);
              continue;
            }
            if (parsed.type === 'queue_status') {
              setQueueStatus({
                pending: Number(parsed.pending ?? 0),
                active: Number(parsed.active ?? 0),
                completed: Number(parsed.completed ?? 0),
                failed: Number(parsed.failed ?? 0),
              });
              continue;
            }
            if (parsed.type === 'trace' && parsed.step) {
              // FIXED: use ChatTrace type, no more index signature error
              const step = parsed.step as ChatTrace;
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, traces: [...(m.traces ?? []), step] } : m
              ));
              continue;
            }
            if (parsed.type === 'traces' && Array.isArray(parsed.traces)) {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, traces: parsed.traces as ChatTrace[] } : m
              ));
              continue;
            }
            if (parsed.type === 'delta' && typeof parsed.content === 'string') {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: (m.content ?? '') + parsed.content } : m
              ));
              continue;
            }
            if (parsed.type === 'content' && typeof parsed.content === 'string') {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: parsed.content as string } : m
              ));
              continue;
            }
            if (parsed.type === 'reasoning' && typeof parsed.content === 'string') {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, reasoning: parsed.content as string } : m
              ));
              continue;
            }
            if (parsed.type === 'critique' && parsed.critique) {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, critique: parsed.critique as ChatMessage['critique'] } : m
              ));
              continue;
            }
            if (parsed.type === 'plan' && parsed.plan) {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, plan: parsed.plan as ChatMessage['plan'] } : m
              ));
              continue;
            }
            if (parsed.type === 'leads' && Array.isArray(parsed.leads)) {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, leads: parsed.leads as ChatMessage['leads'], csv: typeof parsed.csv === 'string' ? parsed.csv : '' }
                  : m
              ));
              continue;
            }
            if (parsed.type === 'questions' && Array.isArray(parsed.questions)) {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, questions: parsed.questions as string[] } : m
              ));
              continue;
            }
            if (parsed.type === 'provider' && typeof parsed.provider === 'string') {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, provider: parsed.provider as string } : m
              ));
              continue;
            }
            if (parsed.type === 'artifact' && parsed.artifact) {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, artifacts: [...(m.artifacts ?? []), parsed.artifact as ChatArtifact] }
                  : m
              ));
              continue;
            }
            if (parsed.type === 'tool_calls' && Array.isArray(parsed.toolCalls)) {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, toolCalls: parsed.toolCalls as ChatToolCall[] } : m
              ));
              continue;
            }
            if (parsed.type === 'complete') {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
              ));
              continue;
            }
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e?.name !== 'AbortError') {
        setError('Network error. Please check your connection and try again.');
        // eslint-disable-next-line no-console
        console.error('[useStreamingChat]', err);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { messages, setMessages, isLoading, error, queueStatus, sendMessage, abort, clearError };
}
