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
    return '>_ ask Siddhi anything...';
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-3 px-1">
        <ModeToggleButton active={isDeepThink} onToggle={() => setIsDeepThink(!isDeepThink)} label="DeepThink" tooltip="Enable deep reasoning" colorScheme="gold" />
        <ModeToggleButton active={isSetuMode} onToggle={() => setIsSetuMode(!isSetuMode)} label="SETU" tooltip="Lead generation mode" colorScheme="red" />
        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        <button onClick={() => onModeChange(mode === 'image' ? 'chat' : 'image')} className={`p-1.5 rounded-lg transition flex items-center gap-1 ${mode === 'image' ? 'bg-pink-600/30 text-pink-400 border border-pink-500/30' : 'text-white/40 hover:text-white/70'}`} title="Image Mode">
          <ImageIcon className="w-4 h-4" />
        </button>
        <button onClick={() => onModeChange(mode === 'video' ? 'chat' : 'video')} className={`p-1.5 rounded-lg transition flex items-center gap-1 ${mode === 'video' ? 'bg-red-600/30 text-red-400 border border-red-500/30' : 'text-white/40 hover:text-white/70'}`} title="Video Mode">
          <Video className="w-4 h-4" />
        </button>
        <button onClick={() => setIsSearchMode(!isSearchMode)} className={`p-1.5 rounded-lg transition ${isSearchMode ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30' : 'text-white/40 hover:text-white/70'}`} title="Web Search">
          <Search className="w-4 h-4" />
        </button>

        <button onClick={isListening ? stopVoice : startVoice} className={`p-1.5 rounded-lg transition ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-white/40 hover:text-white/70'}`} title={isListening ? 'Stop' : 'Voice input'}>
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition" title="Attach file">
          <Paperclip className="w-4 h-4" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md" onChange={handleFileUpload} className="hidden" />

        <div className="ml-auto flex items-center gap-1 text-[10px] font-mono text-cyan-400/60 border border-cyan-500/20 px-2 py-1 rounded-full">
          <Cpu className="w-3 h-3" />
          <span>{deviceLabel}</span>
        </div>

        {onClear && (
          <button onClick={onClear} className="text-red-400/60 hover:text-red-400 transition text-xs font-mono px-2 py-1">✕ Clear</button>
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
