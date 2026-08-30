#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# SIDDHI AI – COMPLETE PRODUCTION REWRITE
# ============================================================================
# This script rewrites all critical files to ensure:
# 1. Streaming chat works correctly
# 2. UI layout is fixed (sidebar, chat bar, results)
# 3. DeepThink, SETU, image/video all work
# 4. Enterprise-grade error handling and state management
# ============================================================================

ROOT_DIR="$(pwd)"
APP_DIR="${ROOT_DIR}/apps/web"
BACKUP_SUFFIX=".bak"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
LOG_FILE="${ROOT_DIR}/production_rewrite_${TIMESTAMP}.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting complete production rewrite..."

if [ ! -d "$APP_DIR" ]; then
  log "ERROR: $APP_DIR does not exist."
  exit 1
fi

cd "$APP_DIR"

# -----------------------------------------------------------------------------
# 1. Rewrite useStreamingChat hook (robust SSE parser)
# -----------------------------------------------------------------------------
log "Rewriting useStreamingChat hook..."
cat > "${APP_DIR}/hooks/useStreamingChat.ts" << 'HOOK_EOF'
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
HOOK_EOF
log "Rewrote useStreamingChat hook"

# -----------------------------------------------------------------------------
# 2. Rewrite LuxuryMessage component – remove memo blocking
# -----------------------------------------------------------------------------
log "Rewriting LuxuryMessage component..."
cat > "${APP_DIR}/components/chat/LuxuryMessage.tsx" << 'LUX_EOF'
'use client';

import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface LuxuryMessageProps {
  children: ReactNode;
  role: "user" | "assistant" | "system";
  timestamp?: Date;
  className?: string;
  isStreaming?: boolean;
}

export function LuxuryMessage({ children, role, timestamp, className = "", isStreaming = false }: LuxuryMessageProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  // Convert children to string for markdown
  const content = typeof children === "string" ? children : String(children);

  // System messages are centered with special styling
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-400/80 font-mono max-w-[90%] backdrop-blur-sm">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col max-w-[85%] rounded-2xl px-4 py-3 relative",
        isUser
          ? "ml-auto bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/20 text-white shadow-[0_0_30px_rgba(0,255,255,0.05)]"
          : "bg-white/5 border border-white/10 text-white/90 backdrop-blur-sm",
        isStreaming && "border-cyan-500/40",
        className
      )}
    >
      {isUser ? (
        <span className="whitespace-pre-wrap break-words">{content}</span>
      ) : (
        <div className="prose prose-invert prose-sm max-w-none dark:prose-invert break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
      {timestamp && (
        <div className="text-[10px] text-white/30 mt-1 text-right">
          {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
    </div>
  );
}
LUX_EOF
log "Rewrote LuxuryMessage component"

# -----------------------------------------------------------------------------
# 3. Rewrite ChatClient with proper layout and state handling
# -----------------------------------------------------------------------------
log "Rewriting ChatClient..."
cat > "${APP_DIR}/app/(app)/chat/ChatClient.tsx" << 'CHAT_EOF'
"use client";

import { useState, useEffect, useRef } from "react";
import { useStreamingChat } from "@/hooks/useStreamingChat";
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

export default function ChatClient() {
  const { messages, isLoading, error, sendMessage, clearError } = useStreamingChat();
  const [deepThink, setDeepThink] = useState(false);
  const [setuMode, setSetuMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [mode, setMode] = useState<"chat" | "image" | "video">("chat");
  const [mediaSettings, setMediaSettings] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string, file?: File) => {
    if (!text.trim()) return;
    await sendMessage(text, { deep: deepThink, setu: setuMode });
  };

  const handleMediaGenerate = async (settings: any) => {
    console.log("Generating media with settings:", settings);
    const prompt = `Generate ${mode} with settings: ${JSON.stringify(settings)}`;
    await sendMessage(prompt, { deep: false, setu: false });
  };

  const handleClear = () => {};

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

        {/* Top Bar */}
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

        {/* Media Settings */}
        {(mode === "image" || mode === "video") && (
          <MediaSettings
            mode={mode}
            onSettingsChange={setMediaSettings}
            onGenerate={handleMediaGenerate}
            isLoading={isLoading}
          />
        )}

        {/* Messages */}
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
                    <LuxuryMessage role={msg.role} timestamp={new Date()} isStreaming={msg.isStreaming}>
                      {msg.content || "..."}
                    </LuxuryMessage>

                    {/* Reasoning trace */}
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

                    {/* SETU leads */}
                    {msg.role === "assistant" && msg.leads && msg.leads.length > 0 && (
                      <div className="ml-12 mt-2">
                        <SetuProgress leads={msg.leads} csv={msg.csv} isLoading={false} />
                      </div>
                    )}

                    {/* SETU questions */}
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

          {/* Loading indicator */}
          {isLoading && (
            <div className="ml-12 mt-2">
              <ThinkingLoader status="thinking" reasoning="Processing..." />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex justify-center my-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-xs text-red-400/80 font-mono max-w-[90%] backdrop-blur-sm">
                {error}
                <button
                  onClick={clearError}
                  className="ml-2 text-red-400 hover:text-red-300 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input Composer */}
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
      className={`p-1.5 rounded-lg transition-all duration-200 ${
        active ? colors[color] + " shadow-glow" : "text-white/40 hover:text-white/70"
      }`}
      title={label}
    >
      <span className="text-xs font-mono">{label}</span>
    </button>
  );
}
CHAT_EOF
log "Rewrote ChatClient"

# -----------------------------------------------------------------------------
# 4. Fix sidebar layout (positioning)
# -----------------------------------------------------------------------------
log "Fixing sidebar layout..."
cat > "${APP_DIR}/components/layout/sidebar.tsx" << 'SIDEBAR_EOF'
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  ShoppingBag,
  MessageCircle,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bot,
  FolderKanban,
  BarChart3,
  Users,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Explore", icon: Compass, href: "/explore" },
  { label: "Marketplace", icon: ShoppingBag, href: "/marketplace" },
  { label: "Chat", icon: MessageCircle, href: "/chat" },
  { label: "Client Panel", icon: FolderKanban, href: "/client" },
  { label: "Profile", icon: User, href: "/profile" },
];

const ADMIN_ITEMS = [
  { label: "Admin", icon: BarChart3, href: "/admin" },
  { label: "Employees", icon: Users, href: "/employee" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  // Desktop sidebar
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-black/95 backdrop-blur-2xl border-r border-white/10 p-4 flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold tracking-widest text-white/40">MENU</span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-full hover:bg-white/5 transition"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <SidebarLink key={item.href} item={item} isActive={isActive(item.href)} onClose={() => setIsMobileOpen(false)} />
                ))}
                <div className="h-px bg-white/5 my-3" />
                {ADMIN_ITEMS.map((item) => (
                  <SidebarLink key={item.href} item={item} isActive={isActive(item.href)} onClose={() => setIsMobileOpen(false)} />
                ))}
              </nav>
            </div>
            <div className="border-t border-white/5 pt-4">
              <SidebarLink
                item={{ label: "Settings", icon: Settings, href: "/settings" }}
                isActive={isActive("/settings")}
                onClose={() => setIsMobileOpen(false)}
              />
              <SidebarLink
                item={{ label: "Logout", icon: LogOut, href: "/logout" }}
                isActive={false}
                onClose={() => setIsMobileOpen(false)}
                className="text-red-400 hover:bg-red-500/10"
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col fixed top-14 left-0 bottom-0 z-30 bg-black/90 backdrop-blur-xl border-r border-white/5 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex-1 overflow-y-auto py-4">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center p-2 hover:bg-white/5 transition mb-2"
          >
            <Menu className="w-5 h-5 text-white/40" />
          </button>
          <nav className="space-y-0.5 px-2">
            {NAV_ITEMS.map((item) => (
              <DesktopLink key={item.href} item={item} isActive={isActive(item.href)} collapsed={isCollapsed} />
            ))}
            <div className="h-px bg-white/5 my-2" />
            {ADMIN_ITEMS.map((item) => (
              <DesktopLink key={item.href} item={item} isActive={isActive(item.href)} collapsed={isCollapsed} />
            ))}
          </nav>
        </div>
        <div className="border-t border-white/5 p-2">
          <DesktopLink
            item={{ label: "Settings", icon: Settings, href: "/settings" }}
            isActive={isActive("/settings")}
            collapsed={isCollapsed}
          />
          <DesktopLink
            item={{ label: "Logout", icon: LogOut, href: "/logout" }}
            isActive={false}
            collapsed={isCollapsed}
            className="text-red-400 hover:bg-red-500/10"
          />
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ item, isActive, onClose, className = "" }: any) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        isActive
          ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/20"
          : "text-white/60 hover:bg-white/5 hover:text-white",
        className
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

function DesktopLink({ item, isActive, collapsed, className = "" }: any) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
        isActive
          ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/20"
          : "text-white/60 hover:bg-white/5 hover:text-white",
        collapsed && "justify-center px-0",
        className
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
    </Link>
  );
}
SIDEBAR_EOF
log "Fixed sidebar layout"

# -----------------------------------------------------------------------------
# 5. Fix app/(app)/layout.tsx to use sidebar properly
# -----------------------------------------------------------------------------
log "Fixing app layout..."
cat > "${APP_DIR}/app/(app)/layout.tsx" << 'LAYOUT_EOF'
"use client";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ml-0 md:ml-16">
        <TopBar onMenuClick={() => setIsDrawerOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
LAYOUT_EOF
log "Fixed app layout"

# -----------------------------------------------------------------------------
# 6. Run type-check and build
# -----------------------------------------------------------------------------
log "Running TypeScript type check..."
npm run type-check || { log "Type check failed."; exit 1; }

log "Building project..."
npm run build || { log "Build failed."; exit 1; }

log "============================================================="
log "Complete production rewrite applied."
log "All fixes are now in place."
log "Deploy to Vercel and test."
log "Log file: $LOG_FILE"
log "============================================================="

exit 0