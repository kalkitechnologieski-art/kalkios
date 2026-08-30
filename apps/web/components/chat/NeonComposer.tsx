'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send,
  Mic,
  ImageIcon,
  Video,
  Search,
  Brain,
  Users,
  X,
  Loader2,
  Paperclip,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NeonComposerProps {
  onSend: (text: string, file?: File) => void;
  isLoading: boolean;
  mode: 'chat' | 'image' | 'video';
  onModeChange: (mode: 'chat' | 'image' | 'video') => void;
  isDeepThink: boolean;
  setIsDeepThink: (val: boolean) => void;
  isSetuMode: boolean;
  setIsSetuMode: (val: boolean) => void;
  isSearchMode: boolean;
  setIsSearchMode: (val: boolean) => void;
  onClear?: () => void;
  className?: string;
  input?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function NeonComposer({
  onSend,
  isLoading,
  mode,
  onModeChange,
  isDeepThink,
  setIsDeepThink,
  isSetuMode,
  setIsSetuMode,
  isSearchMode,
  setIsSearchMode,
  onClear,
  className = '',
  input: externalInput = '',
  onInputChange: externalOnInputChange,
}: NeonComposerProps) {
  const [internalInput, setInternalInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external input if provided, otherwise use internal
  const input = externalInput !== undefined ? externalInput : internalInput;
  const setInput = externalOnInputChange
    ? externalOnInputChange
    : (e: React.ChangeEvent<HTMLInputElement>) => setInternalInput(e.target.value);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    e.target.value = '';
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSend = () => {
    if ((!input.trim() && !file) || isLoading) return;
    onSend(input, file || undefined);
    if (externalOnInputChange === undefined) {
      setInternalInput('');
    }
    setFile(null);
    setPreviewUrl(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 px-1">
        <button
          onClick={() => setIsDeepThink(!isDeepThink)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-mono transition-all",
            isDeepThink
              ? "bg-purple-600/30 text-purple-400 border border-purple-500/30 shadow-glow"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          )}
        >
          <span className="flex items-center gap-1">
            <Brain className="w-3.5 h-3.5" />
            Deep
          </span>
        </button>

        <button
          onClick={() => setIsSetuMode(!isSetuMode)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-mono transition-all",
            isSetuMode
              ? "bg-amber-600/30 text-amber-400 border border-amber-500/30 shadow-glow"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          )}
        >
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            SETU
          </span>
        </button>

        <button
          onClick={() => setIsSearchMode(!isSearchMode)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-mono transition-all",
            isSearchMode
              ? "bg-blue-600/30 text-blue-400 border border-blue-500/30 shadow-glow"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          )}
        >
          <span className="flex items-center gap-1">
            <Search className="w-3.5 h-3.5" />
            Search
          </span>
        </button>

        <button
          onClick={() => onModeChange(mode === 'image' ? 'chat' : 'image')}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-mono transition-all",
            mode === 'image'
              ? "bg-pink-600/30 text-pink-400 border border-pink-500/30 shadow-glow"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          )}
        >
          <span className="flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" />
            Image
          </span>
        </button>

        <button
          onClick={() => onModeChange(mode === 'video' ? 'chat' : 'video')}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-mono transition-all",
            mode === 'video'
              ? "bg-red-600/30 text-red-400 border border-red-500/30 shadow-glow"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          )}
        >
          <span className="flex items-center gap-1">
            <Video className="w-3.5 h-3.5" />
            Video
          </span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {onClear && (
          <button
            onClick={onClear}
            className="text-red-400/60 hover:text-red-400 transition text-xs font-mono px-2 py-1"
          >
            ✕ Clear
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <AnimatePresence>
        {file && previewUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3"
          >
            {file.type.startsWith('image/') && (
              <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
            )}
            {file.type.startsWith('video/') && (
              <video src={previewUrl} className="w-12 h-12 object-cover rounded-lg" muted />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{file.name}</p>
              <p className="text-xs text-white/30">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              onClick={clearFile}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-[0_0_40px_rgba(0,255,255,0.05)] focus-within:border-cyan-500/40 focus-within:shadow-[0_0_60px_rgba(0,255,255,0.1)] transition-all duration-300">
        <input
          type="text"
          value={input}
          onChange={setInput}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading ? 'Siddhi is thinking...' : 'Type your message...'
          }
          className="flex-1 bg-transparent text-white placeholder-cyan-400/30 outline-none text-sm font-mono px-4 py-3 min-h-[48px]"
          disabled={isLoading}
        />

        <button
          onClick={() => {
            // Voice input placeholder
            alert('Voice input coming soon!');
          }}
          className="p-2 rounded-lg hover:bg-white/5 text-cyan-400/40 hover:text-cyan-400 transition"
          title="Voice input"
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          onClick={handleSend}
          disabled={(!input.trim() && !file) || isLoading}
          className={cn(
            "p-2 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 shadow-[0_0_30px_rgba(0,255,255,0.2)] hover:shadow-[0_0_40px_rgba(0,255,255,0.3)] mx-2"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Send className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-[8px] text-cyan-400/20 font-mono tracking-widest">
          <span className="flex items-center gap-1">
            {mode !== 'chat' ? `${mode.toUpperCase()} MODE` : 'CHAT MODE'}
          </span>
          {isDeepThink && <span className="text-purple-400/30">• DEEP THINK</span>}
          {isSetuMode && <span className="text-amber-400/30">• SETU</span>}
          {isSearchMode && <span className="text-blue-400/30">• SEARCH</span>}
        </div>
        <div className="flex items-center gap-2 text-[8px] text-cyan-400/20 font-mono">
          <span>Enter to send</span>
          <span className="text-cyan-400/10">|</span>
          <span>Drop files anywhere</span>
        </div>
      </div>
    </div>
  );
}
