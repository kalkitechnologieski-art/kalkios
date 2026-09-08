'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { MessageGroup } from '@/components/chat/MessageGroup';
import { NeonComposer } from '@/components/chat/NeonComposer';
import { MediaSettings } from '@/components/chat/MediaSettings';
import { GradientGlowBackground } from '@/components/ui/GradientGlowBackground';
import { ThinkingLoader } from '@/components/ui/ThinkingLoader';
import { Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatClient() {
  const { messages: rawMessages, isLoading, error, sendMessage, clearError } = useStreamingChat();
  const [deepThink, setDeepThink] = useState(false);
  const [setuMode, setSetuMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [mode, setMode] = useState<'chat' | 'image' | 'video'>('chat');
  const [mediaSettings, setMediaSettings] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const newGroups: any[] = [];
    let currentGroup: any = null;
    for (const msg of rawMessages) {
      if (msg.role === 'user') {
        if (currentGroup) newGroups.push(currentGroup);
        currentGroup = { id: msg.id, userMessage: msg, assistantMessage: null };
      } else if (msg.role === 'assistant') {
        if (currentGroup) {
          currentGroup.assistantMessage = msg;
          newGroups.push(currentGroup);
          currentGroup = null;
        } else {
          newGroups.push({ id: msg.id, userMessage: null, assistantMessage: msg });
        }
      }
    }
    if (currentGroup) newGroups.push(currentGroup);
    setGroups(newGroups);
  }, [rawMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [groups, isLoading]);

  const handleSend = useCallback(
    async (text: string, file?: File) => {
      if (!text.trim() || isLoading) return;
      await sendMessage(text, { deep: deepThink, setu: setuMode, search: searchMode });
    },
    [sendMessage, isLoading, deepThink, setuMode, searchMode]
  );

  const handleEditUser = useCallback(
    (groupId: string, newContent: string) => {
      const group = groups.find(g => g.id === groupId);
      if (group && group.userMessage) {
        handleSend(newContent);
      }
    },
    [groups, handleSend]
  );

  const handleRegenerate = useCallback(
    (groupId: string) => {
      const group = groups.find(g => g.id === groupId);
      if (group && group.userMessage) {
        handleSend(group.userMessage.content);
      }
    },
    [groups, handleSend]
  );

  const handleFeedback = useCallback(
    (groupId: string, rating: 'up' | 'down') => {
      console.log(`Feedback for group ${groupId}: ${rating}`);
    },
    []
  );

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-white/40">Loading Siddhi…</div>
      </div>
    );
  }

  return (
    <div className="chat-fullscreen relative">
      <GradientGlowBackground isThinking={isLoading} />

      {/* Top Bar */}
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
        <div className="flex gap-1 flex-wrap">
          <CyberToggle active={deepThink} onClick={() => setDeepThink(!deepThink)} label="Deep" color="purple" />
          <CyberToggle active={setuMode} onClick={() => setSetuMode(!setuMode)} label="SETU" color="amber" />
          <CyberToggle active={searchMode} onClick={() => setSearchMode(!searchMode)} label="Search" color="blue" />
          <CyberToggle active={mode === 'image'} onClick={() => setMode(mode === 'image' ? 'chat' : 'image')} label="Image" color="pink" />
          <CyberToggle active={mode === 'video'} onClick={() => setMode(mode === 'video' ? 'chat' : 'video')} label="Video" color="red" />
        </div>
      </div>

      {/* Media Settings */}
      {(mode === 'image' || mode === 'video') && (
        <MediaSettings
          mode={mode}
          onSettingsChange={setMediaSettings}
          onGenerate={async (settings: Record<string, unknown>) => {
            const prompt = `Generate ${mode} with settings: ${JSON.stringify(settings)}`;
            await sendMessage(prompt, { deep: false, setu: false });
          }}
          isLoading={isLoading}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {groups.map((group) => (
            <MessageGroup
              key={group.id}
              id={group.id}
              userMessage={group.userMessage}
              assistantMessage={group.assistantMessage}
              isStreaming={isLoading && group === groups[groups.length - 1] && !group.assistantMessage}
              onEditUser={(newContent) => handleEditUser(group.id, newContent)}
              onRegenerate={() => handleRegenerate(group.id)}
              onCopy={(content) => navigator.clipboard.writeText(content)}
              onFeedback={(rating) => handleFeedback(group.id, rating)}
            />
          ))}
        </AnimatePresence>

        {isLoading && !groups.length && (
          <div className="flex justify-start">
            <ThinkingLoader status="thinking" reasoning="Processing…" />
          </div>
        )}

        {error && (
          <div className="flex justify-center my-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-xs text-red-400/80 font-mono max-w-[90%] backdrop-blur-sm">
              {error}
              <button onClick={clearError} className="ml-2 text-red-400 hover:text-red-300 underline">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
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
        />
      </div>
    </div>
  );
}

function CyberToggle({ active, onClick, label, color }: any) {
  const colors: any = {
    purple: 'active:bg-purple-600/30 active:text-purple-400 active:border-purple-500/30',
    amber: 'active:bg-amber-600/30 active:text-amber-400 active:border-amber-500/30',
    blue: 'active:bg-blue-600/30 active:text-blue-400 active:border-blue-500/30',
    pink: 'active:bg-pink-600/30 active:text-pink-400 active:border-pink-500/30',
    red: 'active:bg-red-600/30 active:text-red-400 active:border-red-500/30',
  };
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all duration-200 ${
        active ? colors[color] + ' shadow-glow' : 'text-white/40 hover:text-white/70'
      }`}
      title={label}
    >
      <span className="text-xs font-mono">{label}</span>
    </button>
  );
}
