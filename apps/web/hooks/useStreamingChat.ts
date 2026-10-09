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
  lane?: string;
  phase?: 'queued' | 'processing' | 'done' | 'failed' | 'canceled';
  position?: number;
  etaSeconds?: number;
  retryAfterSec?: number;
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

export interface SendOptions {
  deep?: boolean;
  setu?: boolean;
  search?: boolean;
  image?: boolean;
  video?: boolean;
  sessionId?: string;
}

interface ErrorState {
  message: string;
  kind: 'offline' | 'auth' | 'rate_limit' | 'network' | 'timeout' | 'provider' | 'unknown';
  retryable: boolean;
}

export function useStreamingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ pending: 0, active: 0, completed: 0, failed: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);
  // Last turn payload so a failed send can be retried without re-typing.
  const lastTurnRef = useRef<{ content: string; options: SendOptions } | null>(null);

  const messagesRef = useRef<ChatMessage[]>(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const runTurn = useCallback(async (
    content: string,
    options: SendOptions,
    reuseLastUser: boolean,
  ) => {
    setError(null);
    setErrorState(null);

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      const offline: ErrorState = {
        message: "You appear to be offline. Reconnect and try again.",
        kind: 'offline',
        retryable: true,
      };
      setError(offline.message);
      setErrorState(offline);
      return;
    }

    const userMsg: ChatMessage = { id: uid('u'), role: 'user', content, isStreaming: false };
    // On retry the user bubble already exists; don't duplicate it.
    if (!reuseLastUser) setMessages((prev) => [...prev, userMsg]);

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
    // Track whether any token arrived so a mid-stream drop keeps the partial
    // answer instead of showing a scary error over good content.
    let receivedAny = false;
    const fail = (state: ErrorState) => { setError(state.message); setErrorState(state); };

    try {
      const history = reuseLastUser
        ? [...messagesRef.current]           // already ends with the user bubble
        : [...messagesRef.current, userMsg];
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          sessionId,
          deep: options.deep ?? true,
          setu: options.setu || false,
          search: options.search ?? true,
          image: options.image || false,
          video: options.video || false,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 401) {
        fail({ message: 'Please log in to chat with Siddhi.', kind: 'auth', retryable: false });
        return;
      }
      if (response.status === 429) {
        fail({ message: 'You are sending messages too fast. Please wait a moment.', kind: 'rate_limit', retryable: true });
        return;
      }
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !response.body || !contentType.includes('text/event-stream')) {
        let detail = '';
        try {
          const json = await response.json() as { error?: string };
          detail = json.error ? ` (${json.error})` : '';
        } catch { /* non-JSON body */ }
        fail({ message: `Siddhi is unavailable right now${detail}. Please try again.`, kind: 'provider', retryable: true });
        return;
      }

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

            if (parsed.type === 'error') {
              const msg = typeof parsed.content === 'string' ? parsed.content
                : typeof parsed.message === 'string' ? parsed.message
                : 'Siddhi encountered an error. Please try again.';
              const timeout = /too long|timed out|timeout/i.test(msg);
              const kind: ErrorState['kind'] = timeout ? 'timeout' : 'provider';
              fail({ message: msg, kind, retryable: true });
              continue;
            }
            if (parsed.type === 'status' && typeof parsed.message === 'string') {
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, progressMessage: parsed.message as string } : m
              ));
              continue;
            }
            if (parsed.type === 'queue_status') {
              setQueueStatus({
                pending: Number(parsed.pending ?? 0),
                active: Number(parsed.active ?? 0),
                completed: Number(parsed.completed ?? 0),
                failed: Number(parsed.failed ?? 0),
                lane: typeof parsed.lane === 'string' ? parsed.lane : undefined,
                phase: (typeof parsed.phase === 'string' ? parsed.phase : undefined) as QueueStatus['phase'],
                position: typeof parsed.position === 'number' ? parsed.position : undefined,
                etaSeconds: typeof parsed.etaSeconds === 'number' ? parsed.etaSeconds : undefined,
                retryAfterSec: typeof parsed.retryAfterSec === 'number' ? parsed.retryAfterSec : undefined,
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
            if ((parsed.type === 'delta' || parsed.type === 'token') && typeof parsed.content === 'string') {
              const chunk = parsed.content as string;
              if (chunk.length > 0) receivedAny = true;
              setMessages((prev) => prev.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: (m.content ?? '') + chunk } : m
              ));
              continue;
            }
            if (parsed.type === 'content' && typeof parsed.content === 'string') {
              if (parsed.content.length > 0) receivedAny = true;
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
      const e = err as { name?: string; message?: string };
      if (e?.name === 'AbortError') {
        // User cancelled — keep whatever streamed, no error banner.
      } else if (receivedAny) {
        // The answer was flowing and then the connection dropped. Keep the
        // partial text and tell the user gently instead of discarding it.
        fail({
          message: 'Connection dropped mid-response. The answer above may be incomplete — retry to continue.',
          kind: 'network',
          retryable: true,
        });
      } else {
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
        fail({
          message: offline
            ? 'You appear to be offline. Reconnect and try again.'
            : (e?.message && e.message !== 'Network error' ? e.message : 'Network error. Please check your connection and try again.'),
          kind: offline ? 'offline' : 'network',
          retryable: true,
        });
        // eslint-disable-next-line no-console
        console.error('[useStreamingChat]', err);
      }
    } finally {
      setIsLoading(false);
      // Stop the typing indicator; drop the placeholder entirely if nothing
      // streamed in, so an error never leaves a dangling "…" bubble.
      setMessages((prev) => prev
        .map((m) => (m.id === assistantMsg.id ? { ...m, isStreaming: false } : m))
        .filter((m) => !(m.id === assistantMsg.id && !m.content)));
      abortControllerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    options: SendOptions = {}
  ) => {
    lastTurnRef.current = { content, options };
    await runTurn(content, options, false);
  }, [runTurn]);

  const retryLastMessage = useCallback(async () => {
    const last = lastTurnRef.current;
    if (!last || isLoading) return;
    // The failed turn's user bubble is still present; reuse it (reuseLastUser)
    // so we don't stack duplicate messages.
    await runTurn(last.content, last.options, true);
  }, [runTurn, isLoading]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => { setError(null); setErrorState(null); }, []);

  return { messages, setMessages, isLoading, error, errorState, queueStatus, sendMessage, retryLastMessage, abort, clearError };
}
