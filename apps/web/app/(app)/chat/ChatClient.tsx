"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ReasoningTrace } from "@/components/chat/ReasoningTrace";
import { SetuProgress } from "@/components/chat/SetuProgress";
import { MediaSettings } from "@/components/chat/MediaSettings";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { LuxuryMessage } from "@/components/chat/LuxuryMessage";
import { NeonComposer } from "@/components/chat/NeonComposer";
import { ThinkingTrace } from "@/components/chat/ThinkingTrace";
import { GradientGlowBackground } from "@/components/ui/GradientGlowBackground";
import { ThinkingLoader } from "@/components/ui/ThinkingLoader";
import { Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
}

export default function ChatClient() {
  const [deepThink, setDeepThink] = useState(false);
  const [setuMode, setSetuMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [mode, setMode] = useState<"chat" | "image" | "video">("chat");
  const [mediaSettings, setMediaSettings] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const currentAssistantId = useRef<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string, file?: File) => {
      if (!text.trim() || isLoading) return;
      setError(null);

      // Add user message
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        isStreaming: false,
        isComplete: true,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add assistant placeholder
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
            deep: deepThink,
            setu: setuMode,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let fullReasoning = "";

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
                        ? { ...msg, tokens: parsed.tokens }
                        : msg
                    )
                  );
                }

                if (parsed.type === "provider" && parsed.provider) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, provider: parsed.provider }
                        : msg
                    )
                  );
                }

                if (parsed.type === "questions") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, questions: parsed.questions, isStreaming: false, isComplete: true }
                        : msg
                    )
                  );
                }

                if (parsed.type === "leads") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsg.id
                        ? { ...msg, leads: parsed.leads, csv: parsed.csv, isStreaming: false, isComplete: true }
                        : msg
                    )
                  );
                }

                if (parsed.type === "setu_pending") {
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
              } catch (_) {}
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
        if (error.name === "AbortError") return;
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
    [messages, deepThink, setuMode, isLoading]
  );

  const handleSend = (text: string, file?: File) => {
    setInput("");
    sendMessage(text, file);
  };

  const handleMediaGenerate = async (settings: any) => {
    const prompt = `Generate ${mode} with settings: ${JSON.stringify(settings)}`;
    setInput("");
    sendMessage(prompt);
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40">Loading Siddhi...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto px-2">
        <GradientGlowBackground isThinking={isLoading} />

        <div className="flex items-center justify-between pb-2 border-b border-white/5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
              <Bot className="w-6 h-6 text-cyan-400 relative" />
            </div>
            <span className="text-white font-semibold text-sm md:text-base">Siddhi</span>
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Online
            </span>
          </div>
          <div className="flex gap-1 flex-wrap">
            <CyberToggle active={deepThink} onClick={() => setDeepThink(!deepThink)} label="Deep" color="purple" />
            <CyberToggle active={setuMode} onClick={() => setSetuMode(!setuMode)} label="SETU" color="amber" />
            <CyberToggle active={searchMode} onClick={() => setSearchMode(!searchMode)} label="Search" color="blue" />
            <CyberToggle active={mode === "image"} onClick={() => setMode(mode === "image" ? "chat" : "image")} label="Image" color="pink" />
            <CyberToggle active={mode === "video"} onClick={() => setMode(mode === "video" ? "chat" : "video")} label="Video" color="red" />
          </div>
        </div>

        {(mode === "image" || mode === "video") && (
          <MediaSettings
            mode={mode}
            onSettingsChange={setMediaSettings}
            onGenerate={handleMediaGenerate}
            isLoading={isLoading}
          />
        )}

        <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col"
              >
                {msg.role === "system" ? (
                  <div className="flex justify-center my-2">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-400/80 font-mono max-w-[90%] backdrop-blur-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <>
                    <LuxuryMessage
                      role={msg.role}
                      timestamp={new Date()}
                      isStreaming={msg.isStreaming}
                    >
                      {msg.content || "..."}
                    </LuxuryMessage>

                    {msg.role === "assistant" && msg.reasoning && (
                      <div className="ml-12 mt-1">
                        <ThinkingTrace
                          reasoning={msg.reasoning}
                          tokens={msg.tokens}
                          timeMs={0}
                          status={msg.isStreaming ? "thinking" : "done"}
                          provider={msg.provider}
                        />
                      </div>
                    )}

                    {msg.role === "assistant" && msg.leads && msg.leads.length > 0 && (
                      <div className="ml-12 mt-2">
                        <SetuProgress leads={msg.leads} csv={msg.csv} isLoading={false} />
                      </div>
                    )}

                    {msg.role === "assistant" && msg.questions && msg.questions.length > 0 && (
                      <div className="ml-12 mt-2 bg-white/5 border border-cyan-500/10 rounded-xl p-3">
                        <p className="text-white/60 text-sm font-mono">Please answer:</p>
                        <ul className="list-disc list-inside text-cyan-400/80 text-sm mt-1 space-y-1">
                          {msg.questions.map((q: string, i: number) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="ml-12 mt-2">
              <ThinkingLoader status="thinking" reasoning="Processing..." />
            </div>
          )}

          {error && (
            <div className="flex justify-center my-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-xs text-red-400/80 font-mono max-w-[90%] backdrop-blur-sm">
                {error}
                <button
                  onClick={() => setError(null)}
                  className="ml-2 text-red-400 hover:text-red-300 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="pt-2 border-t border-white/5">
          <NeonComposer
            onSend={handleSend}
            isLoading={isLoading}
            mode={mode}
            onModeChange={setMode}
            isDeepThink={deepThink}
            setIsDeepThink={setDeepThink}
            isSetuMode={setuMode}
            setIsSetuMode={setSetuMode}
            isSearchMode={searchMode}
            setIsSearchMode={setSearchMode}
            onClear={handleClear}
            input={input}
            onInputChange={handleInputChange}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

function CyberToggle({ active, onClick, label, color }: any) {
  const colors: any = {
    purple: "active:bg-purple-600/30 active:text-purple-400 active:border-purple-500/30",
    amber: "active:bg-amber-600/30 active:text-amber-400 active:border-amber-500/30",
    blue: "active:bg-blue-600/30 active:text-blue-400 active:border-blue-500/30",
    pink: "active:bg-pink-600/30 active:text-pink-400 active:border-pink-500/30",
    red: "active:bg-red-600/30 active:text-red-400 active:border-red-500/30",
  };
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all duration-200 ${active ? colors[color] + " shadow-glow" : "text-white/40 hover:text-white/70"}`}
      title={label}
    >
      <span className="text-xs font-mono">{label}</span>
    </button>
  );
}
