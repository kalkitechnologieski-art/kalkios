// hooks/useStreamingChat.ts
import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
  tokens?: number;
  provider?: string;
  traces?: any[];
  leads?: any[];
  csv?: string;
  questions?: string[];
  progress?: number;
  progressMessage?: string;
}

interface QueueStatus {
  pending: number;
  active: number;
  completed: number;
  failed: number;
}

export function useStreamingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ pending: 0, active: 0, completed: 0, failed: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    content: string,
    options: { deep?: boolean; setu?: boolean; search?: boolean; image?: boolean } = {}
  ) => {
    setError(null);
    const userMsg = { id: crypto.randomUUID(), role: 'user' as const, content, isStreaming: false };
    setMessages(prev => [...prev, userMsg]);

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      reasoning: '',
      isStreaming: true,
      traces: [],
      progress: 0,
      progressMessage: 'Initializing...',
    };
    setMessages(prev => [...prev, assistantMsg]);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          deep: options.deep ?? true,
          setu: options.setu || false,
          search: options.search ?? true,
          image: options.image || false,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '', fullReasoning = '';
      let currentTraces: any[] = [];

      while (reader) {
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

              if (parsed.type === 'error') {
                setError(parsed.message);
                continue;
              }

              if (parsed.type === 'queue_status') {
                setQueueStatus({
                  pending: parsed.pending || 0,
                  active: parsed.active || 0,
                  completed: parsed.completed || 0,
                  failed: parsed.failed || 0,
                });
                continue;
              }

              if (parsed.type === 'trace' && parsed.step) {
                currentTraces.push(parsed.step);
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, traces: [...currentTraces] } : m
                ));
                continue;
              }

              if (parsed.type === 'content' && parsed.content) {
                fullContent += String(parsed.content);
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: fullContent } : m
                ));
              }

              if (parsed.type === 'reasoning' && parsed.content) {
                fullReasoning += String(parsed.content);
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, reasoning: fullReasoning } : m
                ));
              }

              if (parsed.type === 'leads') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, leads: parsed.leads, csv: parsed.csv } : m
                ));
              }

              if (parsed.type === 'questions') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, questions: parsed.questions } : m
                ));
              }

              if (parsed.type === 'image') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: `![Generated Image](${parsed.url})` } : m
                ));
              }

              if (parsed.type === 'video') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: `<video src="${parsed.url}" controls style="max-width:100%;border-radius:12px;" />` } : m
                ));
              }

              if (parsed.type === 'complete') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
                ));
              }
            } catch (_) {}
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setError('Network error. Please check your connection and try again.');
        console.error('[useStreamingChat] Error:', error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { messages, setMessages, isLoading, error, queueStatus, sendMessage, abort, clearError };
}
