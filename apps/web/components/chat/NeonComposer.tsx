// ═══ SIDDHI v4.0 BATCH 3 ═══
// Composer with voice input (SpeechRecognition) and device model badge.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageIcon, Video, Search, Paperclip, Send, Mic, MicOff, Cpu, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CosmicPromptBar } from '@/components/ui/CosmicPromptBar';
import { ModeToggleButton } from '@/components/ui/ModeToggleButton';

interface NeonComposerProps {
  onSend: (text: string, file?: File) => void;
  isLoading: boolean;
  mode: 'chat' | 'image' | 'video' | 'leads';
  onModeChange: (mode: 'chat' | 'image' | 'video' | 'leads') => void;
  isDeepThink: boolean;
  setIsDeepThink: (val: boolean) => void;
  isSetuMode: boolean;
  setIsSetuMode: (val: boolean) => void;
  isSearchMode: boolean;
  setIsSearchMode: (val: boolean) => void;
  onClear?: () => void;
  className?: string;
  imageSettings?: unknown;
}

interface SpeechRecognitionResultLike {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
  resultIndex: number;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionResultLike) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
}

interface WindowWithSpeech {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

export function NeonComposer({
  onSend, isLoading, mode, onModeChange,
  isDeepThink, setIsDeepThink,
  isSetuMode, setIsSetuMode,
  isSearchMode, setIsSearchMode,
  onClear, className = '',
}: NeonComposerProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState<string>('Cloud');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseTextRef = useRef<string>('');

  // Detect device engine readiness
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const mod = await import('@/lib/ai');
        const probe = (mod as unknown as {
          getDeviceState?: () => { status: string; tier: string | null };
        });
        if (typeof probe.getDeviceState === 'function') {
          const st = probe.getDeviceState();
          if (!mounted) return;
          if (st.status === 'ready' && st.tier) setDeviceLabel(`Device · ${st.tier}`);
          else if (st.status === 'unsupported') setDeviceLabel('Cloud');
          else setDeviceLabel('Cloud');
        }
      } catch { if (mounted) setDeviceLabel('Cloud'); }
    };
    void check();
    const interval = setInterval(check, 15_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
    e.target.value = '';
  };

  const clearFile = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  }, [previewUrl]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const startVoice = useCallback(() => {
    if (typeof window === 'undefined') return;
    const win = window as unknown as WindowWithSpeech;
    const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported in this browser'); return; }

    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = true;

    baseTextRef.current = text;

    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result) continue;
        const alt = result[0];
        if (!alt) continue;
        if (result.isFinal) final += alt.transcript;
        else interim += alt.transcript;
      }
      const prefix = baseTextRef.current ? baseTextRef.current + ' ' : '';
      setText(prefix + (final || interim));
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  }, [text]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  const handleSend = (textToSend: string) => {
    if ((!textToSend.trim() && !file) || isLoading) return;
    onSend(textToSend, file ?? undefined);
    setText('');
    clearFile();
  };

  const getPlaceholder = () => {
    if (isListening) return '🎤 Listening...';
    if (mode === 'image') return '🎨 Describe the image you want to generate...';
    if (mode === 'video') return '🎬 Describe the video you want to create...';
    if (mode === 'leads') return '🔍 Search for companies or industries to find leads...';
    return '>_ ask Siddhi anything...';
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Premium mode selector bar */}
      <div className="flex flex-wrap items-center gap-3 px-2 py-3 rounded-2xl bg-gradient-to-r from-black/60 via-slate-950/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-lg">
        <ModeToggleButton active={isDeepThink} onToggle={() => setIsDeepThink(!isDeepThink)} label="DeepThink" tooltip="Enable deep reasoning" colorScheme="gold" />
        <ModeToggleButton active={mode === 'leads'} onToggle={() => onModeChange(mode === 'leads' ? 'chat' : 'leads')} label="Leads" tooltip="Lead generation mode" colorScheme="red" />
        
        {/* Premium separator */}
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent hidden sm:block" />

        {/* Premium mode buttons with glow effects */}
        <motion.button
          onClick={() => onModeChange(mode === 'image' ? 'chat' : 'image')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`group relative p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
            mode === 'image'
              ? 'bg-gradient-to-br from-pink-600/30 to-rose-600/30 text-pink-300 border border-pink-500/40 shadow-lg shadow-pink-500/20'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
          }`}
          title="Image Generation"
        >
          <ImageIcon className="w-5 h-5" />
          {mode === 'image' && (
            <span className="text-[10px] font-semibold hidden sm:inline">Image</span>
          )}
        </motion.button>

        <motion.button
          onClick={() => onModeChange(mode === 'video' ? 'chat' : 'video')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`group relative p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
            mode === 'video'
              ? 'bg-gradient-to-br from-red-600/30 to-pink-600/30 text-red-300 border border-red-500/40 shadow-lg shadow-red-500/20'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
          }`}
          title="Video Generation"
        >
          <Video className="w-5 h-5" />
          {mode === 'video' && (
            <span className="text-[10px] font-semibold hidden sm:inline">Video</span>
          )}
        </motion.button>

        <motion.button
          onClick={() => setIsSearchMode(!isSearchMode)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`group relative p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
            isSearchMode
              ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/30 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/20'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
          }`}
          title="Web Search"
        >
          <Search className="w-5 h-5" />
          {isSearchMode && (
            <span className="text-[10px] font-semibold hidden sm:inline">Search</span>
          )}
        </motion.button>

        {/* Voice input - Premium */}
        <motion.button
          onClick={isListening ? stopVoice : startVoice}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`group relative p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
            isListening
              ? 'bg-gradient-to-br from-red-500/30 to-orange-500/30 text-red-300 border border-red-500/40 shadow-lg shadow-red-500/30 animate-pulse'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
          }`}
          title={isListening ? 'Stop recording' : 'Voice input'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          {isListening && (
            <span className="text-[10px] font-semibold hidden sm:inline">Listening</span>
          )}
        </motion.button>

        {/* File attachment - Premium */}
        <motion.button
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative p-2.5 rounded-xl transition-all duration-300 hover:bg-white/5 text-white/50 hover:text-white/80 border border-transparent hover:border-white/10"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </motion.button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md" onChange={handleFileUpload} className="hidden" />

        {/* Device status badge - Premium */}
        <div className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 text-cyan-400/70 text-xs font-medium">
          <Cpu className="w-4 h-4" />
          <span className="hidden sm:inline">{deviceLabel}</span>
        </div>

        {/* Clear button - Premium */}
        {onClear && (
          <motion.button
            onClick={onClear}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/80 hover:bg-red-500/20 hover:text-red-300 transition-all text-xs font-medium"
          >
            Clear
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {file && previewUrl && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3">
            {file.type.startsWith('image/') && <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />}
            {file.type.startsWith('video/') && <video src={previewUrl} className="w-12 h-12 object-cover rounded-lg" muted />}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{file.name}</p>
              <p className="text-xs text-white/30">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button onClick={clearFile} className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <CosmicPromptBar onSend={handleSend} isLoading={isLoading} placeholder={getPlaceholder()} mode={mode} />

      {isLoading && (
        <div className="flex items-center gap-2 px-2 text-[10px] text-cyan-400/40 font-mono">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Processing…</span>
        </div>
      )}
    </div>
  );
}
