// SIDDHI-B1-FIX-CLIENT — casts for useStreamingChat compat
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
import { Badge } from '@/components/ui/badge';
import { Bot, ImageIcon, Video, Sparkles, Loader2, Clock, CheckCircle, XCircle, Brain, Download, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// == SIDDHI F1 WIRE - IMPORTS ==
import { PremiumChatTopBar } from '@/components/chat/PremiumChatTopBar';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { useConversations } from '@/hooks/useConversations';
import type { ConversationMessage } from '@/lib/conversations/types';
import type { ChatMessage as SiddhiChatMessage } from '@/hooks/useStreamingChat';
import { LeadViewer } from '@/components/siddhi/LeadViewer';
import { EnterpriseLeadViewer } from '@/components/siddhi/EnterpriseLeadViewer';
import { MediaProgress } from '@/components/chat/MediaProgress';
import type { LeadGenerationResult } from '@/lib/ai/lead-generator';

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

  // == SIDDHI F1 WIRE - HOOK ==
  const conv = useConversations();
  const [historyOpen, setHistoryOpen] = useState(false);
  const loadedConvIdRef = useRef<string | null>(null);
  const skipPersistRef = useRef(false);
  const prevLoadingRef = useRef(false);

  // Load active conversation -> messages
  useEffect(() => {
    if (!conv.ready) return;
    const id = conv.active?.id ?? null;
    if (!id) return;
    if (loadedConvIdRef.current === id) return;
    loadedConvIdRef.current = id;
    skipPersistRef.current = true;
    // A reload mid-stream would otherwise persist isStreaming=true forever and
    // pin a fake "typing" bubble to the history.
    setMessages((conv.active?.messages ?? []).map((m) => ({ ...m, isStreaming: false })) as unknown as SiddhiChatMessage[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.ready, conv.active?.id, setMessages]);

  // Persist messages -> active conversation
  useEffect(() => {
    if (!conv.ready) return;
    if (skipPersistRef.current) { skipPersistRef.current = false; return; }
    if (loadedConvIdRef.current === null) return;
    conv.replaceMessages(messages as unknown as ConversationMessage[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, conv.ready]);

  // Trigger auto-title when a response completes
  useEffect(() => {
    const was = prevLoadingRef.current;
    prevLoadingRef.current = isLoading;
    if (was && !isLoading) void conv.maybeAutoTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const { loadMemory, saveMemory } = useMemory();
  const [searchMode, setSearchMode] = useState(true);
  const [mode, setMode] = useState<'chat' | 'image' | 'video' | 'leads'>('chat');
  const [mounted, setMounted] = useState(false);
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [leadResult, setLeadResult] = useState<LeadGenerationResult | null>(null);
  const [leadsPanelOpen, setLeadsPanelOpen] = useState(false);
  const [isGeneratingLeads, setIsGeneratingLeads] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const saved = await loadMemory();
      if (saved && saved.length > 0) {
        setMessages(saved.map((m) => ({ ...m, isStreaming: false })));
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

      if (mode === 'leads') {
        const userMsg: SiddhiChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsGeneratingLeads(true);
        setLeadResult(null);
        try {
          const res = await fetch('/api/leads/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text, maxResults: 20 }),
          });
          const data = await res.json().catch(() => null) as LeadGenerationResult & { error?: string } | null;
          if (!res.ok || !data || !Array.isArray(data.leads)) {
            throw new Error(data?.error || `lead service returned ${res.status}`);
          }
          const result = data as LeadGenerationResult;
          setLeadResult(result);
          setLeadsPanelOpen(true);
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Found ${result.leads.length} leads from ${result.totalSearched} websites. Open the Leads panel above to review and export the CSV with ${result.totalScraped} contacts.`,
          }]);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'unknown error';
          // eslint-disable-next-line no-console
          console.error('Lead generation failed:', msg);
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `I could not generate leads right now (${msg}). Please try again with a different industry or region.`,
          }]);
        } finally {
          setIsGeneratingLeads(false);
        }
        return;
      }

      if (mode === 'image') {
        // Fixed recipe — the buyer just types the subject and presses Enter.
        await sendMessage(`Generate image: ${text} | Style: photorealistic | Quality: high | Size: 2K | Ratio: 16:9`, { deep: true, setu: false, search: false, image: true });
        return;
      }

      if (mode === 'video') {
        await sendMessage(`Generate video: ${text} | Resolution: 1080P | Duration: 5s | Aspect: 16:9 | Quality: balanced`, { deep: true, setu: false, search: false, video: true });
        return;
      }

      await sendMessage(text, { deep: true, setu: false, search: searchMode });
    },
    [sendMessage, isLoading, searchMode, mode, setMessages]
  );

  // ─── Handle Image/Video Edit: regenerate with new prompt ────────
  const handleEdit = useCallback(
    async (messageId: string, newPrompt: string) => {
      const originalMsg = messages.find(m => m.id === messageId);
      if (!originalMsg) return;

      const isImage = originalMsg.content.includes('![');
      if (isImage) {
        await sendMessage(`Generate image: ${newPrompt} | Style: photorealistic | Quality: high | Size: 2K | Ratio: 16:9`, { deep: true, setu: false, search: false, image: true });
      } else {
        await sendMessage(`Generate video: ${newPrompt} | Resolution: 1080P | Duration: 5s | Aspect: 16:9 | Quality: balanced`, { deep: true, setu: false, search: false, video: true });
      }
    },
    [sendMessage, messages]
  );

  const handleModeToggle = (newMode: 'chat' | 'image' | 'video' | 'leads') => {
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

  const DeepThinkIndicator = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Brain className="w-3.5 h-3.5 text-purple-400" />
      </motion.div>
      <span className="text-[9px] font-mono text-purple-400/80 tracking-wider">DEEPTHINK</span>
      <motion.span
        className="w-1.5 h-1.5 rounded-full bg-purple-400"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
    </motion.div>
  );

  return (
    <div className="chat-fullscreen relative z-30 bg-gradient-to-br from-black via-slate-950 to-black min-h-screen overflow-hidden">
      {/* Premium ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <GradientGlowBackground isThinking={isLoading} />

      {/* == SIDDHI F1 WIRE - PREMIUM TOP BAR == */}
      <PremiumChatTopBar
        title={conv.active?.title ?? 'New chat'}
        messageCount={messages.length}
        autoTitled={conv.active?.autoTitled ?? false}
        modeLabel={mode === 'leads' ? 'Leads' : mode === 'image' ? 'Image' : mode === 'video' ? 'Video' : 'Siddhi'}
        onNew={() => { conv.createNew(); setMessages([]); }}
        onOpenHistory={() => setHistoryOpen((v) => !v)}
        onRename={(t) => conv.renameActive(t)}
        onDelete={() => { conv.deleteActive(); setMessages([]); }}
        onAutoTitle={() => void conv.maybeAutoTitle()}
        historyOpen={historyOpen}
      />

      <ChatHistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        list={conv.list}
        activeId={conv.active?.id ?? null}
        onSelect={(id) => {
          const c = conv.selectConversation(id);
          if (c) setMessages(c.messages.map((m) => ({ ...m, isStreaming: false })) as unknown as SiddhiChatMessage[]);
        }}
        onNew={() => { conv.createNew(); setMessages([]); }}
        onDelete={(id) => conv.deleteById(id)}
        onRename={(id, t) => {
          if (id === conv.active?.id) conv.renameActive(t);
        }}
      />

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
          <DeepThinkIndicator />
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
            onClick={() => handleModeToggle('leads')}
            className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 ${
              mode === 'leads'
                ? 'bg-green-600/30 text-green-400 border border-green-500/30 shadow-glow'
                : 'text-white/40 hover:text-white/70'
            }`}
            title="Lead Generation Mode"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-[10px] font-mono hidden sm:inline">Leads</span>
          </button>
        </div>
      </div>

      {/* Leads dashboard — collapsed by default so it never covers the chat */}
      <AnimatePresence initial={false}>
        {leadResult && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-white/5 border border-green-500/15 rounded-xl overflow-hidden mb-2"
          >
            <button
              onClick={() => setLeadsPanelOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition"
            >
              <span className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <Download className="w-4 h-4 text-green-400" />
                Lead results
                <Badge variant="secondary" className="text-[10px]">
                  {leadResult.leads.length} found
                </Badge>
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-green-400/70">
                {leadsPanelOpen ? 'HIDE' : 'SHOW'}
                {leadsPanelOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {leadsPanelOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-green-500/10"
                >
                  {/* Bounded height + internal scroll: chat stays readable below */}
                  <div className="max-h-[45vh] overflow-y-auto p-4">
                    <EnterpriseLeadViewer
                      leads={leadResult.leads}
                      onExport={() => {
                        if (!leadResult.csvContent) return;
                        const blob = new Blob([leadResult.csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `kalki-leads-${Date.now()}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated generation progress: leads / image / video */}
      {isGeneratingLeads && <MediaProgress isLoading mode="leads" />}
      {(mode === 'image' || mode === 'video') && isLoading && (
        <MediaProgress key={mode} isLoading mode={mode} />
      )}

      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages
            // Failed/aborted turns used to persist empty assistant bubbles that
            // rendered as a dangling "…" — never show those.
            .filter((msg) => !(msg.role === 'assistant' && !msg.isStreaming && !String(msg.content ?? '').replace(/[.…\s]/g, '')))
            .map((msg) => {
            const contentStr = typeof msg.content === 'string' ? msg.content : String(msg.content);
            const isImageMessage = msg.role === 'assistant' && contentStr.includes('![');
            const isVideoMessage = msg.role === 'assistant' && contentStr.includes('<video');

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
                    onEdit={(isImageMessage || isVideoMessage) ? (newPrompt: string) => handleEdit(msg.id, newPrompt) : undefined}
                    messageId={msg.id}
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
                  <div className="ml-12 mt-2">{renderTraces(msg.traces as TraceStep[])}</div>
                )}

                {msg.role === 'assistant' && msg.leads && msg.leads.length > 0 && (
                  <div className="ml-12 mt-2">
                    <SetuProgress
                      leads={msg.leads as unknown as Array<{ name: string; email: string; company: string; confidence: number }>}
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
          isDeepThink={true}
          setIsDeepThink={() => {}}
          isSetuMode={false}
          setIsSetuMode={() => {}}
          isSearchMode={searchMode}
          setIsSearchMode={setSearchMode}
          onClear={() => {}}
        />
      </div>
    </div>
  );
}
