import { useState, useCallback, useRef } from "react";

export function useStreamingChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, options: { deep?: boolean; setu?: boolean; search?: boolean; image?: string } = {}) => {
    setError(null);
    const userMsg = { id: crypto.randomUUID(), role: "user", content, isStreaming: false };
    setMessages(prev => [...prev, userMsg]);
    const assistantMsg = { id: crypto.randomUUID(), role: "assistant", content: "", reasoning: "", isStreaming: true };
    setMessages(prev => [...prev, assistantMsg]);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        if (response.status >= 500) setError("I'm having trouble connecting. Please try again later.");
        else setError("Something went wrong. Please try again.");
        console.error("API error:", response.status);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "", fullReasoning = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "error") setError(parsed.message);
              if (parsed.type === "content") {
                fullContent += parsed.content;
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: fullContent } : m
                ));
              }
              if (parsed.type === "reasoning") {
                fullReasoning += parsed.content;
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, reasoning: fullReasoning } : m
                ));
              }
              if (parsed.type === "leads") {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: `Found ${parsed.leads.length} leads.`, leads: parsed.leads, csv: parsed.csv } : m
                ));
              }
              if (parsed.type === "questions") {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, content: `Please answer:\n${parsed.questions.map((q: string, i: number) => `${i+1}. ${q}`).join("\n")}`, questions: parsed.questions } : m
                ));
              }
              if (parsed.type === "status") {
                console.log("[Status]", parsed.message);
              }
              if (parsed.type === "complete") {
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
                ));
              }
            } catch (_) {}
          }
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setError("Network error. Please check your connection and try again.");
        console.error("[ADMIN] Chat error:", error);
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
