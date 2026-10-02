'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Mic, MicOff, Image as ImageIcon, Video, FileText, 
  X, Plus, Sparkles, Zap, Brain, Search, Settings2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EnhancedComposerProps {
  onSend: (text: string, files?: File[]) => void;
  isLoading: boolean;
  placeholder?: string;
  mode: 'chat' | 'image' | 'video';
  onModeChange: (mode: 'chat' | 'image' | 'video') => void;
  features?: {
    voiceInput?: boolean;
    fileUpload?: boolean;
    imageGeneration?: boolean;
    videoGeneration?: boolean;
    deepThink?: boolean;
    search?: boolean;
  };
}

export function EnhancedComposer({
  onSend,
  isLoading,
  placeholder = 'Ask Siddhi anything...',
  mode,
  onModeChange,
  features = {},
}: EnhancedComposerProps) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [deepThinkEnabled, setDeepThinkEnabled] = useState(true);
  const [searchEnabled, setSearchEnabled] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join('');
          setInput(transcript);
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles(prev => [...prev, ...files]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    if (isLoading) return;

    onSend(input, attachedFiles);
    setInput('');
    setAttachedFiles([]);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const modes = [
    { id: 'chat' as const, icon: Sparkles, label: 'Chat', color: 'cyan' as const },
    { id: 'image' as const, icon: ImageIcon, label: 'Image', color: 'purple' as const },
    { id: 'video' as const, icon: Video, label: 'Video', color: 'pink' as const },
  ];

  return (
    <div className="relative">
      {/* Mode Selector */}
      <div className="flex items-center gap-2 mb-3 px-2">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          const colors = {
            cyan: isActive ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'hover:bg-white/5 text-white/40',
            purple: isActive ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'hover:bg-white/5 text-white/40',
            pink: isActive ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' : 'hover:bg-white/5 text-white/40',
          };
          
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                colors[m.color]
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {m.label}
            </button>
          );
        })}
        
        <div className="flex-1" />
        
        {/* Feature Toggles */}
        {features.deepThink && (
          <button
            onClick={() => setDeepThinkEnabled(!deepThinkEnabled)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
              deepThinkEnabled 
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                : 'hover:bg-white/5 text-white/40 border-transparent'
            )}
          >
            <Brain className="w-3.5 h-3.5" />
            Deep Think
          </button>
        )}
        
        {features.search && (
          <button
            onClick={() => setSearchEnabled(!searchEnabled)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
              searchEnabled 
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                : 'hover:bg-white/5 text-white/40 border-transparent'
            )}
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
        )}
      </div>

      {/* Attached Files Preview */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2 mb-3 px-2"
          >
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs"
              >
                {file.type.startsWith('image/') && <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />}
                {file.type.startsWith('video/') && <Video className="w-3.5 h-3.5 text-purple-400" />}
                {file.type.startsWith('application/') && <FileText className="w-3.5 h-3.5 text-yellow-400" />}
                <span className="text-white/70 max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-white/40 hover:text-white/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Area */}
      <div className="glass-strong rounded-2xl border border-white/10 p-3">
        <div className="flex items-end gap-3">
          {/* File Upload Button */}
          {features.fileUpload && (
            <div className="flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,application/pdf,text/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="text-white/40 hover:text-white/80"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Text Input */}
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? 'Listening...' : placeholder}
              rows={1}
              className="w-full bg-transparent text-white placeholder:text-white/30 resize-none outline-none text-sm leading-relaxed max-h-[200px]"
              disabled={isRecording}
            />
          </div>

          {/* Voice Input */}
          {features.voiceInput && (
            <button
              onClick={handleToggleRecording}
              className={cn(
                'flex-shrink-0 p-2 rounded-full transition-all',
                isRecording 
                  ? 'bg-red-500/20 text-red-400 animate-pulse' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              )}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() && attachedFiles.length === 0 || isLoading}
            variant="cyber"
            size="icon"
            className="flex-shrink-0"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Zap className="w-5 h-5" />
              </motion.div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick Suggestions */}
      <QuickSuggestions onSelect={(text) => setInput(text)} />
    </div>
  );
}

/**
 * Context-aware quick suggestions
 */
function QuickSuggestions({ onSelect }: { onSelect: (text: string) => void }) {
  const suggestions = [
    "Explain quantum computing",
    "Create a marketing strategy",
    "Design a logo for my startup",
    "Analyze this document",
    "Generate a video tutorial",
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-3 px-2">
      {suggestions.slice(0, 3).map((suggestion, index) => (
        <motion.button
          key={suggestion}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(suggestion)}
          className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white/80 text-xs transition-all"
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
}
