import { useState, useCallback, useRef } from "react";

// ─── Safe content extractor ──────────────────────────────────────────────
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

export function useStreamingChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, options: { deep?: boolean; setu?: boolean; search?: boolean; image?: string } = {}) => {
    setError(null);
    const userMsg = { id: crypto.randomUUID(), role: 'user', content, isStreaming: false };
    setMessages(prev => [...prev, userMsg]);
    const assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: '', reasoning: '', isStreaming: true, traces: [] };
    setMessages(prev => [...prev, assistantMsg]);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          deep: options.deep || false,
          setu: options.setu || false,
          search: options.search || false,
          image: options.image,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        setError('Something went wrong. Please try again.');
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '', fullReasoning = '';
      let buffer = '';
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
              // ─── Trace events ──────────────────────────────────────────
              if (parsed.type === 'trace' && parsed.step) {
                currentTraces.push(parsed.step);
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, traces: [...currentTraces] } : m
                ));
                continue;
              }
              // ─── Content events ──────────────────────────────────────
              if (parsed.type === 'content' && parsed.content) {
                fullContent += safeContent(parsed.content);
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: fullContent } : m
                ));
              }
              // ─── Reasoning events ──────────────────────────────────
              if (parsed.type === 'reasoning' && parsed.content) {
                fullReasoning += safeContent(parsed.content);
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, reasoning: fullReasoning } : m
                ));
              }
              // ─── Leads events ──────────────────────────────────────
              if (parsed.type === 'leads') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, leads: parsed.leads, csv: parsed.csv } : m
                ));
              }
              // ─── Questions events ──────────────────────────────────
              if (parsed.type === 'questions') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, questions: parsed.questions } : m
                ));
              }
              // ─── Image events ──────────────────────────────────────
              if (parsed.type === 'image') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: `![Generated Image](${parsed.url})` } : m
                ));
              }
              // ─── Video events ──────────────────────────────────────
              if (parsed.type === 'video') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: `<video src="${parsed.url}" controls style="max-width:100%;border-radius:12px;" />` } : m
                ));
              }
              // ─── Complete event ────────────────────────────────────
              if (parsed.type === 'complete') {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
                ));
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data, e);
            }
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

  return { messages, isLoading, error, sendMessage, abort, clearError };
}
