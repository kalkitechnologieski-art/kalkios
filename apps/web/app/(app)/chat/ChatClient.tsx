"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { NeonComposer } from "@/components/chat/NeonComposer";
import { ThinkingTrace } from "@/components/chat/ThinkingTrace";
import { SetuProgress } from "@/components/chat/SetuProgress";
import { MediaSettings } from "@/components/chat/MediaSettings";
import { MediaProgress } from "@/components/chat/MediaProgress";
import { GradientGlowBackground } from "@/components/ui/GradientGlowBackground";
import { ThinkingLoader } from "@/components/ui/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// Types
// ============================================================================
interface Message {
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

// ============================================================================
// Markdown Renderer
// ============================================================================
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline ? (
            <pre className="bg-black/40 p-2 sm:p-3 rounded-lg overflow-x-auto text-xs sm:text-sm border border-white/10 my-2">
              <code className={className} {...props}>{children}</code>
            </pre>
          ) : (
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs sm:text-sm" {...props}>{children}</code>
          );
        },
        a({ href, children, ...props }: any) {
          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline text-sm" {...props}>{children}</a>;
        },
        blockquote({ children, ...props }: any) {
          return <blockquote className="border-l-4 border-cyan-500/30 pl-3 sm:pl-4 py-1 my-2 text-white/60 italic text-sm" {...props}>{children}</blockquote>;
        },
        ul({ children, ...props }: any) {
          return <ul className="list-disc list-inside space-y-1 my-2 text-sm" {...props}>{children}</ul>;
        },
        ol({ children, ...props }: any) {
          return <ol className="list-decimal list-inside space-y-1 my-2 text-sm" {...props}>{children}</ol>;
        },
        h1({ children, ...props }: any) {
          return <h1 className="text-lg sm:text-xl font-bold my-2 sm:my-3" {...props}>{children}</h1>;
        },
        h2({ children, ...props }: any) {
          return <h2 className="text-base sm:text-lg font-bold my-1.5 sm:my-2" {...props}>{children}</h2>;
        },
        h3({ children, ...props }: any) {
          return <h3 className="text-sm sm:text-base font-bold my-1 sm:my-1.5" {...props}>{children}</h3>;
        },
        p({ children, ...props }: any) {
          return <p className="my-1 leading-relaxed text-sm" {...props}>{children}</p>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ============================================================================
// Chat Message Component
// ============================================================================
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 sm:px-4 py-2 text-xs text-cyan-400/80 font-mono max-w-[90%] backdrop-blur-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`
          max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 relative
          ${
            isUser
              ? "bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/20 text-white shadow-[0_0_30px_rgba(0,255,255,0.05)]"
              : "bg-white/5 border border-white/10 text-white/90 backdrop-blur-sm"
          }
        `}
      >
        <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
          <MarkdownContent content={message.content} />
        </div>

        {message.role === "assistant" && message.reasoning && (
          <div className="mt-2 sm:mt-3">
            <ThinkingTrace
              reasoning={message.reasoning}
              tokens={message.tokens}
              timeMs={0}
              status="done"
              provider={message.provider}
            />
          </div>
        )}

        {message.role === "assistant" && message.leads && message.leads.length > 0 && (
          <div className="mt-2 sm:mt-3">
            <SetuProgress leads={message.leads} csv={message.csv} isLoading={false} />
          </div>
        )}

        {message.role === "assistant" && message.questions && message.questions.length > 0 && (
          <div className="mt-2 sm:mt-3 bg-white/5 border border-cyan-500/10 rounded-xl p-2 sm:p-3">
            <p className="text-white/60 text-xs sm:text-sm font-mono">Please answer:</p>
            <ul className="list-disc list-inside text-cyan-400/80 text-xs sm:text-sm mt-1 space-y-1">
              {message.questions.map((q: string, i: number) => <li key={i}>{q}</li>)}
            </ul>
          </div>
        )}

        {message.isComplete && (
          <div className="text-[10px] text-white/30 mt-1 sm:mt-2 text-right">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Toggle Button
// ============================================================================
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
      className={`
        px-1.5 sm:px-2 py-1 rounded-lg transition-all duration-200 text-[10px] sm:text-xs font-mono
        ${active ? colors[color] + " shadow-glow" : "text-white/40 hover:text-white/70"}
      `}
      title={label}
    >
      {label}
    </button>
  );
}

// ============================================================================
// Main Chat Client – Mobile-first, Always Active
// ============================================================================
export default function ChatClient() {
  const { messages, isLoading, error, sendMessage, clearError, clearMessages } = useStreamingChat();
  const [deepThink, setDeepThink] = useState(false);
  const [setuMode, setSetuMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [mode, setMode] = useState<"chat" | "image" | "video">("chat");
  const [mediaProgressVisible, setMediaProgressVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "connected" | "disconnected">("idle");
  const endRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  // Mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Media progress visibility
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isLoading && (mode === "image" || mode === "video")) {
      setMediaProgressVisible(true);
    } else {
      timerRef.current = setTimeout(() => {
        setMediaProgressVisible(false);
        timerRef.current = null;
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading, mode]);

  // Health check – keep connection alive
  useEffect(() => {
    const checkHealth = async () => {
      try {
        setConnectionStatus("connecting");
        const response = await fetch("/api/health");
        if (response.ok) {
          setConnectionStatus("connected");
          reconnectAttempts.current = 0;
        } else {
          setConnectionStatus("disconnected");
          handleReconnect();
        }
      } catch (error) {
        setConnectionStatus("disconnected");
        handleReconnect();
      }
    };

    const handleReconnect = () => {
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setTimeout(checkHealth, 3000 * reconnectAttempts.current);
      }
    };

    // Check health immediately, then every 30 seconds
    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSend = useCallback(
    async (text: string, file?: File) => {
      if (!text.trim()) return;
      await sendMessage(text, { deep: deepThink, setu: setuMode });
    },
    [sendMessage, deepThink, setuMode]
  );

  const handleClear = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  const handleMediaProgressComplete = useCallback(() => {
    setMediaProgressVisible(false);
  }, []);

  // Handle media generation from settings
  const handleMediaGenerate = useCallback(
    async (settings: any) => {
      const prompt = `Generate ${mode} with settings: ${JSON.stringify(settings)}`;
      await sendMessage(prompt, { deep: false, setu: false });
    },
    [mode, sendMessage]
  );

  // Loading state
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40 font-mono text-sm sm:text-base">Loading Siddhi...</div>
      </div>
    );
  }

  // Connection status indicator
  const statusColor =
    connectionStatus === "connected"
      ? "text-green-400"
      : connectionStatus === "connecting"
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <ErrorBoundary>
      <div className="relative flex flex-col safe-area-padding safe-area-padding-top h-[calc(100dvh-130px)] sm:h-[calc(100dvh-140px)] max-w-4xl mx-auto px-1.5 sm:px-4">
        <GradientGlowBackground isThinking={isLoading} />

        {/* Header */}
        <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-white/5 flex-wrap gap-1 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
              <Bot className="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400 relative" />
            </div>
            <span className="text-white font-semibold text-xs sm:text-base">Siddhi</span>
            <span className={`text-[8px] sm:text-[10px] flex items-center gap-1 ${statusColor}`}>
              <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse ${statusColor}`} />
              {connectionStatus === "connected"
                ? "Online"
                : connectionStatus === "connecting"
                ? "Connecting..."
                : "Offline"}
            </span>
          </div>
          <div className="flex gap-0.5 sm:gap-1 flex-wrap">
            <CyberToggle active={deepThink} onClick={() => setDeepThink(!deepThink)} label="Deep" color="purple" />
            <CyberToggle active={setuMode} onClick={() => setSetuMode(!setuMode)} label="SETU" color="amber" />
            <CyberToggle active={searchMode} onClick={() => setSearchMode(!searchMode)} label="Search" color="blue" />
            <CyberToggle active={mode === "image"} onClick={() => setMode(mode === "image" ? "chat" : "image")} label="Image" color="pink" />
            <CyberToggle active={mode === "video"} onClick={() => setMode(mode === "video" ? "chat" : "video")} label="Video" color="red" />
          </div>
        </div>

        {/* Media Settings */}
        {(mode === "image" || mode === "video") && (
          <div className="shrink-0 mt-1 sm:mt-2">
            <MediaSettings
              mode={mode}
              onSettingsChange={() => {}}
              onGenerate={handleMediaGenerate}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Media Progress */}
        {mediaProgressVisible && (mode === "image" || mode === "video") && (
          <div className="shrink-0 mt-1 sm:mt-2">
            <MediaProgress
              isLoading={isLoading}
              mode={mode}
              onComplete={handleMediaProgressComplete}
            />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-2 sm:py-4 space-y-3 sm:space-y-4 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center text-white/40 space-y-2"
              >
                <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400/20" />
                <p className="text-sm sm:text-base font-mono">Ask Siddhi anything...</p>
                <p className="text-xs sm:text-sm font-mono opacity-60">DeepThink • SETU • Search • Image • Video</p>
              </motion.div>
            )}
            {messages.map((msg: Message) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {isLoading && !mediaProgressVisible && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 backdrop-blur-sm">
                <ThinkingLoader status="thinking" reasoning="Processing..." />
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center my-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 sm:px-4 py-2 text-xs text-red-400/80 font-mono max-w-[90%] backdrop-blur-sm flex items-center gap-1 sm:gap-2">
                <span>⚠️ {error}</span>
                <button onClick={clearError} className="text-red-400 hover:text-red-300 underline text-xs">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 pt-1.5 sm:pt-2 border-t border-white/5 pb-0.5 sm:pb-1">
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
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
