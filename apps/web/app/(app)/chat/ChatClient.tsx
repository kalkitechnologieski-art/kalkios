"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { NeonComposer } from "@/components/chat/NeonComposer";
import { ThinkingTrace } from "@/components/chat/ThinkingTrace";
import { SetuProgress } from "@/components/chat/SetuProgress";
import { MediaSettings } from "@/components/chat/MediaSettings";
import { GradientGlowBackground } from "@/components/ui/GradientGlowBackground";
import { ThinkingLoader } from "@/components/ui/ThinkingLoader";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Markdown Renderer – safely renders markdown without dangerouslySetInnerHTML
// -----------------------------------------------------------------------------
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline ? (
            <pre className="bg-black/40 p-3 rounded-lg overflow-x-auto text-sm border border-white/10 my-2">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          ) : (
            <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          );
        },
        a({ href, children, ...props }: any) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
              {...props}
            >
              {children}
            </a>
          );
        },
        blockquote({ children, ...props }: any) {
          return (
            <blockquote
              className="border-l-4 border-cyan-500/30 pl-4 py-1 my-2 text-white/60 italic"
              {...props}
            >
              {children}
            </blockquote>
          );
        },
        ul({ children, ...props }: any) {
          return <ul className="list-disc list-inside space-y-1 my-2" {...props}>{children}</ul>;
        },
        ol({ children, ...props }: any) {
          return <ol className="list-decimal list-inside space-y-1 my-2" {...props}>{children}</ol>;
        },
        h1({ children, ...props }: any) {
          return <h1 className="text-xl font-bold my-3" {...props}>{children}</h1>;
        },
        h2({ children, ...props }: any) {
          return <h2 className="text-lg font-bold my-2" {...props}>{children}</h2>;
        },
        h3({ children, ...props }: any) {
          return <h3 className="text-base font-bold my-1.5" {...props}>{children}</h3>;
        },
        p({ children, ...props }: any) {
          return <p className="my-1 leading-relaxed" {...props}>{children}</p>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// -----------------------------------------------------------------------------
// Chat Message Component – replaces LuxuryMessage
// -----------------------------------------------------------------------------
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-400/80 font-mono max-w-[90%] backdrop-blur-sm">
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
          max-w-[85%] rounded-2xl px-4 py-3 relative
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

        {/* Reasoning trace for assistant */}
        {message.role === "assistant" && message.reasoning && (
          <div className="mt-3">
            <ThinkingTrace
              reasoning={message.reasoning}
              tokens={message.tokens}
              timeMs={0}
              status="done"
              provider={message.provider}
            />
          </div>
        )}

        {/* SETU leads */}
        {message.role === "assistant" && message.leads && message.leads.length > 0 && (
          <div className="mt-3">
            <SetuProgress leads={message.leads} csv={message.csv} isLoading={false} />
          </div>
        )}

        {/* Socratic questions */}
        {message.role === "assistant" && message.questions && message.questions.length > 0 && (
          <div className="mt-3 bg-white/5 border border-cyan-500/10 rounded-xl p-3">
            <p className="text-white/60 text-sm font-mono">Please answer:</p>
            <ul className="list-disc list-inside text-cyan-400/80 text-sm mt-1 space-y-1">
              {message.questions.map((q: string, i: number) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Timestamp */}
        {message.isComplete && (
          <div className="text-[10px] text-white/30 mt-2 text-right">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// -----------------------------------------------------------------------------
// Toggle Button for modes (Deep, SETU, Search, Image, Video)
// -----------------------------------------------------------------------------
function CyberToggle({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color: "purple" | "amber" | "blue" | "pink" | "red";
}) {
  const colors: Record<string, string> = {
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
        p-1.5 rounded-lg transition-all duration-200 text-xs font-mono
        ${active ? colors[color] + " shadow-glow" : "text-white/40 hover:text-white/70"}
      `}
      title={label}
    >
      {label}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Main Chat Client – mobile-first, production-grade
// -----------------------------------------------------------------------------
export default function ChatClient() {
  const { messages, isLoading, error, sendMessage, clearError } = useStreamingChat();
  const [deepThink, setDeepThink] = useState(false);
  const [setuMode, setSetuMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [mode, setMode] = useState<"chat" | "image" | "video">("chat");
  const [isMounted, setIsMounted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Mount guard for hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (text: string, file?: File) => {
      if (!text.trim()) return;
      await sendMessage(text, { deep: deepThink, setu: setuMode });
    },
    [sendMessage, deepThink, setuMode]
  );

  const handleClear = useCallback(() => {
    // Optional: clear chat history
  }, []);

  // Show loader while mounting
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40 font-mono">Loading Siddhi...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto px-2 sm:px-4">
        <GradientGlowBackground isThinking={isLoading} />

        {/* Header / Top Bar – fully responsive */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5 flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
              <Bot className="w-5 h-5 md:w-6 md:h-6 text-cyan-400 relative" />
            </div>
            <span className="text-white font-semibold text-sm md:text-base">Siddhi</span>
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Online
            </span>
          </div>
          <div className="flex gap-1 flex-wrap">
            <CyberToggle
              active={deepThink}
              onClick={() => setDeepThink(!deepThink)}
              label="Deep"
              color="purple"
            />
            <CyberToggle
              active={setuMode}
              onClick={() => setSetuMode(!setuMode)}
              label="SETU"
              color="amber"
            />
            <CyberToggle
              active={searchMode}
              onClick={() => setSearchMode(!searchMode)}
              label="Search"
              color="blue"
            />
            <CyberToggle
              active={mode === "image"}
              onClick={() => setMode(mode === "image" ? "chat" : "image")}
              label="Image"
              color="pink"
            />
            <CyberToggle
              active={mode === "video"}
              onClick={() => setMode(mode === "video" ? "chat" : "video")}
              label="Video"
              color="red"
            />
          </div>
        </div>

        {/* Media Settings (when in image/video mode) */}
        {(mode === "image" || mode === "video") && (
          <div className="shrink-0 mt-2">
            <MediaSettings
              mode={mode}
              onSettingsChange={() => {}}
              onGenerate={(settings) => {
                const prompt = `Generate ${mode} with settings: ${JSON.stringify(settings)}`;
                sendMessage(prompt, { deep: false, setu: false });
              }}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Messages Container – scrollable, with bottom padding for mobile */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.map((msg: Message) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {/* Thinking Loader */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white/5 border border-white/10 backdrop-blur-sm">
                <ThinkingLoader status="thinking" reasoning="Processing..." />
              </div>
            </div>
          )}

          {/* Error Display – user-friendly */}
          {error && (
            <div className="flex justify-center my-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-xs text-red-400/80 font-mono max-w-[90%] backdrop-blur-sm flex items-center gap-2">
                <span>⚠️ {error}</span>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-300 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input Area – fixed at bottom */}
        <div className="shrink-0 pt-2 border-t border-white/5 pb-1">
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
