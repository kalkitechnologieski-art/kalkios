'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useMemory } from '@/hooks/useMemory';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { NeonComposer } from '@/components/chat/NeonComposer';
import { ThinkingTrace } from '@/components/chat/ThinkingTrace';
import { SetuProgress } from '@/components/chat/SetuProgress';
import { GradientGlowBackground } from '@/components/ui/GradientGlowBackground';
import { ThinkingLoader } from '@/components/ui/ThinkingLoader';
import { Bot, ImageIcon, Video, Sparkles, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TraceStep {
  id: string;
  type: 'search' | 'reasoning' | 'scoring' | 'consensus' | 'refinement' | 'complete';
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  details?: any;
  timestamp: number;
  duration?: number;
  tokens?: number;
  provider?: string;
}

export default function ChatClient() {
  const { messages, setMessages, isLoading, error, queueStatus, sendMessage, clearError } = useStreamingChat();
  const { loadMemory, saveMemory } = useMemory();
  const [deepThink, setDeepThink] = useState(true);
  const [setuMode, setSetuMode] = useState(false);
  const [searchMode, setSearchMode] = useState(true);
  const [mode, setMode] = useState<'chat' | 'image' | 'video'>('chat');
  const [imageSettings, setImageSettings] = useState({
    size: '2K',
    ratio: '16:9',
    quality: 'standard',
    style: 'photorealistic',
  });
  const [mounted, setMounted] = useState(false);
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const saved = await loadMemory();
      if (saved && saved.length > 0) {
        setMessages(saved);
      }
      setMounted(true);
    };
    load();
  }, [loadMemory, setMessages]);

  useEffect(() => {
    if (mounted && messages.length > 0) {
      saveMemory(messages);
    }
  }, [messages, mounted, saveMemory]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const handleSend = useCallback(
    async (text: string, file?: File) => {
      if (!text.trim() || isLoading) return;

      if (mode === 'image') {
        const enhancedPrompt = `Generate image: ${text} | Style: ${imageSettings.style} | Quality: ${imageSettings.quality} | Size: ${imageSettings.size} | Ratio: ${imageSettings.ratio}`;
        await sendMessage(enhancedPrompt, { deep: false, setu: false, image: true });
        return;
      }

      if (mode === 'video') {
        const enhancedPrompt = `Generate video: ${text}`;
        await sendMessage(enhancedPrompt, { deep: false, setu: false });
        return;
      }

      await sendMessage(text, { deep: true, setu: setuMode, search: true });
    },
    [sendMessage, isLoading, setuMode, mode, imageSettings]
  );

  const handleModeToggle = (newMode: 'chat' | 'image' | 'video') => {
    setMode(mode === newMode ? 'chat' : newMode);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-white/40">Loading Siddhi…</div>
      </div>
    );
  }

  const renderTraces = (traces: TraceStep[]) => {
    if (!traces || traces.length === 0) return null;
    return (
      <div className="mt-2 space-y-1">
        {traces.map((step) => (
          <div
            key={step.id}
            className={`text-xs font-mono p-2 rounded-lg border ${
              step.status === 'completed'
                ? 'border-green-500/20 bg-green-500/5 text-green-400'
                : step.status === 'running'
                ? 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400'
                : step.status === 'failed'
                ? 'border-red-500/20 bg-red-500/5 text-red-400'
                : 'border-white/5 text-white/40'
            }`}
          >
            <span className="flex items-center gap-2">
              {step.status === 'running' && (
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              )}
              {step.status === 'completed' && <span className="text-green-400">✓</span>}
              {step.status === 'failed' && <span className="text-red-400">✗</span>}
              {step.message}
              {step.duration && (
                <span className="text-white/30 text-[10px]">({step.duration}ms)</span>
              )}
            </span>
            {step.details?.results !== undefined && (
              <span className="text-white/30 text-[10px] ml-1">
                {step.details.results} results
              </span>
            )}
            {step.provider && (
              <span className="text-white/20 text-[10px] ml-2">via {step.provider}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const QueueStatus = () => {
    const total = queueStatus.pending + queueStatus.active + queueStatus.completed + queueStatus.failed;
    if (total === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-3 py-1.5 bg-white/5 border border-cyan-500/10 rounded-full text-[10px] font-mono"
      >
        <span className="flex items-center gap-1 text-white/40">
          <Clock className="w-3 h-3" />
          Queue
        </span>
        {queueStatus.pending > 0 && (
          <span className="text-yellow-400">{queueStatus.pending} pending</span>
        )}
        {queueStatus.active > 0 && (
          <span className="text-cyan-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            {queueStatus.active} active
          </span>
        )}
        {queueStatus.completed > 0 && (
          <span className="text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {queueStatus.completed}
          </span>
        )}
        {queueStatus.failed > 0 && (
          <span className="text-red-400 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            {queueStatus.failed}
          </span>
        )}
      </motion.div>
    );
  };

  const ImageSettingsPanel = () => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white/5 border border-cyan-500/10 rounded-xl p-3 mb-2 overflow-hidden"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-white/40 font-mono block mb-1">Size</label>
          <select
            value={imageSettings.size}
            onChange={(e) => setImageSettings(prev => ({ ...prev, size: e.target.value }))}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none"
          >
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="3K">3K</option>
            <option value="4K">4K</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-white/40 font-mono block mb-1">Ratio</label>
          <select
            value={imageSettings.ratio}
            onChange={(e) => setImageSettings(prev => ({ ...prev, ratio: e.target.value }))}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none"
          >
            <option value="1:1">1:1</option>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="4:3">4:3</option>
            <option value="3:4">3:4</option>
            <option value="21:9">21:9</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-white/40 font-mono block mb-1">Quality</label>
          <select
            value={imageSettings.quality}
            onChange={(e) => setImageSettings(prev => ({ ...prev, quality: e.target.value }))}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none"
          >
            <option value="low">Low</option>
            <option value="standard">Standard</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-white/40 font-mono block mb-1">Style</label>
          <input
            type="text"
            value={imageSettings.style}
            onChange={(e) => setImageSettings(prev => ({ ...prev, style: e.target.value }))}
            placeholder="e.g. cinematic"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none placeholder-white/20"
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="chat-fullscreen relative">
      <GradientGlowBackground isThinking={isLoading} />

      <div className="flex items-center justify-between pb-2 border-b border-white/5 flex-wrap gap-2 sticky top-0 bg-black/80 backdrop-blur-sm z-10 py-1">
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
        <div className="flex items-center gap-1 flex-wrap">
          <QueueStatus />
          <button
            onClick={() => handleModeToggle('image')}
            className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 ${
              mode === 'image'
                ? 'bg-pink-600/30 text-pink-400 border border-pink-500/30 shadow-glow'
                : 'text-white/40 hover:text-white/70'
            }`}
            title="Image Mode"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-[10px] font-mono hidden sm:inline">Image</span>
          </button>
          <button
            onClick={() => handleModeToggle('video')}
            className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 ${
              mode === 'video'
                ? 'bg-red-600/30 text-red-400 border border-red-500/30 shadow-glow'
                : 'text-white/40 hover:text-white/70'
            }`}
            title="Video Mode"
          >
            <Video className="w-4 h-4" />
            <span className="text-[10px] font-mono hidden sm:inline">Video</span>
          </button>
          <button
            onClick={() => setDeepThink(!deepThink)}
            className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 ${
              deepThink
                ? 'bg-purple-600/30 text-purple-400 border border-purple-500/30 shadow-glow'
                : 'text-white/40 hover:text-white/70'
            }`}
            title="DeepThink"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-mono hidden sm:inline">Deep</span>
          </button>
          <button
            onClick={() => setSetuMode(!setuMode)}
            className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 ${
              setuMode
                ? 'bg-amber-600/30 text-amber-400 border border-amber-500/30 shadow-glow'
                : 'text-white/40 hover:text-white/70'
            }`}
            title="SETU Mode"
          >
            <span className="text-xs font-bold">SETU</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mode === 'image' && <ImageSettingsPanel />}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const contentStr = typeof msg.content === 'string' ? msg.content : String(msg.content);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {msg.role === 'system' ? (
                  <div className="flex justify-center my-2">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-400/80 font-mono max-w-[90%] backdrop-blur-sm">
                      {contentStr}
                    </div>
                  </div>
                ) : (
                  <ChatMessage
                    content={contentStr}
                    role={msg.role}
                    timestamp={new Date()}
                    isStreaming={msg.isStreaming}
                  />
                )}

                {msg.role === 'assistant' && msg.reasoning && (
                  <div className="ml-12 mt-1">
                    <ThinkingTrace
                      reasoning={typeof msg.reasoning === 'string' ? msg.reasoning : String(msg.reasoning)}
                      tokens={msg.tokens}
                      timeMs={0}
                      status="done"
                      provider={msg.provider}
                    />
                  </div>
                )}

                {msg.role === 'assistant' && msg.traces && msg.traces.length > 0 && (
                  <div className="ml-12 mt-2">{renderTraces(msg.traces)}</div>
                )}

                {msg.role === 'assistant' && msg.leads && msg.leads.length > 0 && (
                  <div className="ml-12 mt-2">
                    <SetuProgress
                      leads={msg.leads}
                      csv={msg.csv || ''}
                      isLoading={false}
                    />
                  </div>
                )}

                {msg.role === 'assistant' && msg.questions && msg.questions.length > 0 && (
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
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <div className="ml-12 mt-2">
            <ThinkingLoader status="thinking" reasoning="Processing…" />
          </div>
        )}

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

      <div className="chat-input-floating">
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
          onClear={() => {}}
          imageSettings={imageSettings}
        />
      </div>
    </div>
  );
}
