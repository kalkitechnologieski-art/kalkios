// ═══ SIDDHI v4.0 BATCH 2 ═══
// Multimodal input with URL revocation + file input reset.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Mic, Paperclip, Image as ImageIcon, Video, Music, X, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type MediaType = 'text' | 'image' | 'video' | 'audio' | 'document';

export interface Attachment {
  id: string;
  file: File;
  type: MediaType;
  url: string;
  preview?: string;
  name: string;
  size: number;
}

interface MultimodalInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  onMediaModeChange: (mode: MediaType) => void;
  isLoading: boolean;
  isListening: boolean;
  onVoiceToggle: () => void;
  activeMode: MediaType;
  placeholder?: string;
  voiceTranscript?: string;
  onVoiceTranscriptChange?: (text: string) => void;
}

const MEDIA_BUTTONS: Array<{ type: MediaType; icon: typeof ImageIcon; label: string }> = [
  { type: 'image', icon: ImageIcon, label: 'Image' },
  { type: 'video', icon: Video, label: 'Video' },
  { type: 'audio', icon: Music, label: 'Audio' },
  { type: 'document', icon: Paperclip, label: 'Document' },
];

export function MultimodalInput({
  onSend, onMediaModeChange, isLoading, isListening, onVoiceToggle,
  activeMode, placeholder = '>_ enter command...',
  voiceTranscript = '', onVoiceTranscriptChange,
}: MultimodalInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // URL revocation on unmount
  useEffect(() => {
    return () => { for (const a of attachments) URL.revokeObjectURL(a.url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (voiceTranscript && isListening) setText(voiceTranscript);
  }, [voiceTranscript, isListening]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    const newAttachments: Attachment[] = [];
    for (const file of files) {
      const type: MediaType = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : 'document';
      const url = URL.createObjectURL(file);
      newAttachments.push({
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        file, type, url,
        preview: type === 'image' ? url : undefined,
        name: file.name,
        size: file.size,
      });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (newAttachments[0]) setTimeout(() => onMediaModeChange(newAttachments[0]!.type), 0);
  }, [onMediaModeChange]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.url);
      const filtered = prev.filter((a) => a.id !== id);
      if (filtered.length === 0) setTimeout(() => onMediaModeChange('text'), 0);
      return filtered;
    });
  }, [onMediaModeChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      handleFileUpload(dt.files);
    }
  }, [handleFileUpload]);

  const handleSend = useCallback(() => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    onSend(text, attachments);
    // Revoke URLs after send
    for (const a of attachments) URL.revokeObjectURL(a.url);
    setText('');
    setAttachments([]);
    onVoiceTranscriptChange?.('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [text, attachments, isLoading, onSend, onVoiceTranscriptChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  return (
    <div className="relative w-full" onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }} onDrop={handleDrop}>
      <AnimatePresence>
        {isDragging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-cyan-500/10 backdrop-blur-sm border-2 border-dashed border-cyan-400 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
              <p className="text-cyan-400 font-mono text-sm">Drop files here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`relative bg-black/60 backdrop-blur-xl border rounded-2xl transition-all duration-300 ${isFocused ? 'border-cyan-500/40' : 'border-cyan-500/20'}`}>
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map((att) => (
              <div key={att.id} className="relative group flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2 pr-3">
                {att.type === 'image' && att.preview && <img src={att.preview} alt={att.name} className="w-12 h-12 object-cover rounded" />}
                {att.type === 'video' && <video src={att.url} className="w-12 h-12 object-cover rounded" muted />}
                {att.type === 'audio' && <div className="w-12 h-12 bg-cyan-500/10 rounded flex items-center justify-center"><Music className="w-6 h-6 text-cyan-400" /></div>}
                {att.type === 'document' && <div className="w-12 h-12 bg-purple-500/10 rounded flex items-center justify-center"><Paperclip className="w-6 h-6 text-purple-400" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-mono truncate max-w-[120px]">{att.name}</p>
                  <p className="text-cyan-400/30 text-[10px] font-mono">{(att.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => removeAttachment(att.id)} className="p-1 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-400 transition">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1 p-2">
          <div className="flex items-center gap-0.5 border-r border-cyan-500/10 pr-1">
            {MEDIA_BUTTONS.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => { onMediaModeChange(type); fileInputRef.current?.click(); }}
                className={`p-1.5 rounded-lg transition-all ${activeMode === type ? 'bg-cyan-500/20 text-cyan-400' : 'text-cyan-400/30 hover:text-cyan-400/60 hover:bg-white/5'}`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <button onClick={onVoiceToggle} className={`p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-cyan-400/40 hover:text-cyan-400 hover:bg-white/5'}`}>
            <Mic className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPaste={handlePaste}
            placeholder={isListening ? '🎤 Listening...' : placeholder}
            className="flex-1 bg-transparent text-white placeholder-cyan-400/30 outline-none text-sm font-mono px-2 resize-none min-h-[40px] max-h-[120px] leading-relaxed"
            rows={1}
            disabled={isLoading}
          />

          <button onClick={handleSend} disabled={(!text.trim() && attachments.length === 0) || isLoading} className="p-2 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md"
          onChange={(e) => { handleFileUpload(e.target.files); e.target.value = ''; }}
          className="hidden"
        />
      </div>
    </div>
  );
}
