"use client";

import { useState, useEffect, useRef } from "react";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import { ThinkingTrace } from "@/components/chat/ThinkingTrace";
import { SetuProgress } from "@/components/chat/SetuProgress";
import { MediaSettings } from "@/components/chat/MediaSettings";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { LuxuryMessage } from "@/components/chat/LuxuryMessage";
import { NeonComposer } from "@/components/chat/NeonComposer";
import { GradientGlowBackground } from "@/components/ui/GradientGlowBackground";
import { ThinkingLoader } from "@/components/ui/ThinkingLoader";
import { Bot } from "lucide-react";
import { motion } from "framer-motion";

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
    await sendMessage(text, { deep: deepThink, setu: setuMode, search: searchMode });
  };

  const handleMediaGenerate = async (settings: any) => {
    const prompt = `Generate ${mode} with settings: ${JSON.stringify(settings)}`;
    await sendMessage(prompt, { deep: false, setu: false });
  };

  const handleClear = () => {};

  if (!isMounted) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-white/40">Loading Siddhi...</div></div>;
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
            <CyberToggle active={deepThink} onClick={() => setDeepThink(!deepThink)} label="Deep" color="purple" />
            <CyberToggle active={setuMode} onClick={() => setSetuMode(!setuMode)} label="SETU" color="amber" />
            <CyberToggle active={searchMode} onClick={() => setSearchMode(!searchMode)} label="Search" color="blue" />
            <CyberToggle active={mode === "image"} onClick={() => setMode(mode === "image" ? "chat" : "image")} label="Image" color="pink" />
            <CyberToggle active={mode === "video"} onClick={() => setMode(mode === "video" ? "chat" : "video")} label="Video" color="red" />
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
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {msg.role === "system" ? (
                <div className="flex justify-center my-2">
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-400/80 font-mono max-w-[90%] backdrop-blur-sm">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <LuxuryMessage role={msg.role} timestamp={new Date()}>
                  <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                </LuxuryMessage>
              )}
              {msg.role === "assistant" && msg.reasoning && (
                <div className="ml-12 mt-1">
                  <ThinkingTrace
                    reasoning={msg.reasoning}
                    tokens={msg.tokens}
                    timeMs={0}
                    status="done"
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
            </motion.div>
          ))}

          {isLoading && (
            <div className="ml-12 mt-2">
              <ThinkingLoader status="thinking" reasoning="Processing..." />
            </div>
          )}

          {error && (
            <div className="flex justify-center my-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-xs text-red-400/80 font-mono max-w-[90%] backdrop-blur-sm">
                {error}
                <button onClick={clearError} className="ml-2 text-red-400 hover:text-red-300 underline">Dismiss</button>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
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
      className={`p-1.5 rounded-lg transition-all duration-200 ${active ? colors[color] + " shadow-glow" : "text-white/40 hover:text-white/70"}`}
      title={label}
    >
      <span className="text-xs font-mono">{label}</span>
    </button>
  );
}
