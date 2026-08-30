import { useState, useCallback, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
  isStreaming: boolean;
  isComplete: boolean;
  leads?: any[];
  csv?: string;
  questions?: string[];
  tokens?: number;
  provider?: string;
  model?: string;
}

export function useStreamingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAssistantId = useRef<string | null>(null);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string, options: { deep?: boolean; setu?: boolean; image?: string } = {}) => {
      setError(null);

      // Add user message
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        isStreaming: false,
        isComplete: true,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Create assistant placeholder
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        reasoning: "",
        isStreaming: true,
        isComplete: false,
      };
      currentAssistantId.current = assistantMsg.id;
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
          let errorMsg = "Something went wrong. Please try again.";
          try {
            const errData = await response.json();
            if (errData.message) errorMsg = errData.message;
          } catch (_) {}
          setError(errorMsg);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsg.id
                ? { ...msg, content: `⚠️ ${errorMsg}`, isStreaming: false, isComplete: true }
                : msg
            )
          );
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let fullReasoning = "";
        let leadData: any = null;
        let questionData: any = null;

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === "error") {
                  setError(parsed.message);
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, content: `⚠️ ${parsed.message}`, isStreaming: false, isComplete: true }
                        : msg
                    )
                  );
                  return;
                }

                if (parsed.type === "status") {
                  // Show status message in reasoning
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, reasoning: parsed.message, isStreaming: true }
                        : msg
                    )
                  );
                  continue;
                }

                if (parsed.type === "content" && parsed.content) {
                  fullContent += parsed.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, content: fullContent, isStreaming: true }
                        : msg
                    )
                  );
                }

                if (parsed.type === "reasoning" && parsed.content) {
                  fullReasoning += parsed.content;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, reasoning: fullReasoning, isStreaming: true }
                        : msg
                    )
                  );
                }

                if (parsed.type === "usage" && parsed.tokens) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, tokens: parsed.tokens, isStreaming: true }
                        : msg
                    )
                  );
                }

                if (parsed.type === "questions" && parsed.questions) {
                  questionData = parsed.questions;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, questions: questionData, isStreaming: false, isComplete: true }
                        : msg
                    )
                  );
                }

                if (parsed.type === "leads" && parsed.leads) {
                  leadData = { leads: parsed.leads, csv: parsed.csv };
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, leads: parsed.leads, csv: parsed.csv, isStreaming: false, isComplete: true }
                        : msg
                    )
                  );
                }

                if (parsed.type === "setu_pending" && parsed.questions) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, questions: parsed.questions, content: parsed.message, isStreaming: false, isComplete: true }
                        : msg
                    )
                  );
                }

                if (parsed.type === "complete") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, isStreaming: false, isComplete: true }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Silently ignore malformed JSON
              }
            }
          }
        }

        // If no complete event was sent, mark as complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsg.id && msg.isStreaming
              ? { ...msg, isStreaming: false, isComplete: true }
              : msg
          )
        );

      } catch (error: any) {
        if (error.name === "AbortError") {
          // User cancelled, don't show error
          return;
        }
        console.error("[ADMIN] Chat error:", error);
        setError("Network error. Please check your connection and try again.");
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsg.id
              ? { ...msg, content: "⚠️ Network error. Please try again.", isStreaming: false, isComplete: true }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
        currentAssistantId.current = null;
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
  const clearMessages = useCallback(() => setMessages([]), []);

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
