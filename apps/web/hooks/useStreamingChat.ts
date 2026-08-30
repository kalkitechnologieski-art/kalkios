import { useState, useCallback, useRef } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
  tokens?: number;
  provider?: string;
  leads?: any[];
  csv?: string;
  questions?: string[];
  isStreaming?: boolean;
  isComplete?: boolean;
}

export function useStreamingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string, options: { deep?: boolean; setu?: boolean; image?: string } = {}) => {
      setError(null);

      // Add user message
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        isStreaming: false,
        isComplete: true,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add assistant placeholder
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        reasoning: "",
        isStreaming: true,
        isComplete: false,
      };
      setMessages((prev) => [...prev, assistantMsg]);

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
            image: options.image,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          if (response.status >= 500) {
            setError("I'm having trouble connecting. Please try again later.");
          } else {
            setError("Something went wrong. Please try again.");
          }
          console.error("API error:", response.status);
          setIsLoading(false);
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let fullReasoning = "";
        let hasContent = false;

        if (!reader) {
          setError("Failed to read response stream.");
          setIsLoading(false);
          return;
        }

        // Process the stream
        while (true) {
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

                if (parsed.type === "error") {
                  setError(parsed.message);
                  continue;
                }

                if (parsed.type === "content") {
                  fullContent += parsed.content;
                  hasContent = true;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, content: fullContent, isStreaming: true }
                        : m
                    )
                  );
                }

                if (parsed.type === "reasoning") {
                  fullReasoning += parsed.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, reasoning: fullReasoning }
                        : m
                    )
                  );
                }

                if (parsed.type === "usage") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? { ...m, tokens: parsed.tokens }
                        : m
                    )
                  );
                }

                if (parsed.type === "leads") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? {
                            ...m,
                            content: `Found ${parsed.leads.length} leads.`,
                            leads: parsed.leads,
                            csv: parsed.csv,
                          }
                        : m
                    )
                  );
                }

                if (parsed.type === "questions") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? {
                            ...m,
                            content: `Please answer:\n${parsed.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}`,
                            questions: parsed.questions,
                          }
                        : m
                    )
                  );
                }

                if (parsed.type === "complete") {
                  // Mark as complete
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsg.id
                        ? {
                            ...m,
                            isStreaming: false,
                            isComplete: true,
                            content: fullContent || m.content,
                          }
                        : m
                    )
                  );
                }
              } catch (e) {
                // Ignore malformed JSON
              }
            }
          }
        }

        // If no content was received, show a fallback
        if (!hasContent && !fullContent) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? {
                    ...m,
                    content: "I received an empty response. Please try again.",
                    isStreaming: false,
                    isComplete: true,
                  }
                : m
            )
          );
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setError("Network error. Please check your connection.");
          console.error("[ADMIN] Chat error:", error);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    abort,
    clearError,
    clearMessages,
  };
}
