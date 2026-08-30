"use client";

import { useState, useRef, useCallback } from "react";
import { ImageIcon, Video, Search, Brain, X, Loader2, Paperclip, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CosmicPromptBar } from "@/components/ui/CosmicPromptBar";
import { ModeToggleButton } from "@/components/ui/ModeToggleButton";

interface NeonComposerProps {
  onSend: (text: string, file?: File) => void;
  isLoading: boolean;
  mode: "chat" | "image" | "video";
  onModeChange: (mode: "chat" | "image" | "video") => void;
  isDeepThink: boolean;
  setIsDeepThink: (val: boolean) => void;
  isSetuMode: boolean;
  setIsSetuMode: (val: boolean) => void;
  isSearchMode: boolean;
  setIsSearchMode: (val: boolean) => void;
  onClear?: () => void;
  className?: string;
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
  className = "",
}: NeonComposerProps) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    e.target.value = "";
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
  }, []);

  const handleSend = useCallback((textToSend: string) => {
    if ((!textToSend.trim() && !file) || isLoading) return;
    onSend(textToSend, file || undefined);
    setText("");
    setFile(null);
    setPreviewUrl(null);
  }, [file, isLoading, onSend]);

  return (
    <div className={`flex flex-col gap-2 sm:gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 px-0.5 sm:px-1">
        <ModeToggleButton
          active={isDeepThink}
          onToggle={() => setIsDeepThink(!isDeepThink)}
          label="Deep"
          tooltip="Enable deep reasoning"
          colorScheme="gold"
        />
        <ModeToggleButton
          active={isSetuMode}
          onToggle={() => setIsSetuMode(!isSetuMode)}
          label="SETU"
          tooltip="Lead generation mode"
          colorScheme="red"
        />
        <div className="h-4 sm:h-6 w-px bg-white/10 hidden sm:block" />

        <button
          onClick={() => setIsSearchMode(!isSearchMode)}
          className={`p-1 sm:p-1.5 rounded-lg transition ${
            isSearchMode ? "bg-blue-600/30 text-blue-400 border border-blue-500/30" : "text-white/40 hover:text-white/70"
          }`}
          title="Web Search"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          onClick={() => onModeChange(mode === "image" ? "chat" : "image")}
          className={`p-1 sm:p-1.5 rounded-lg transition ${
            mode === "image" ? "bg-pink-600/30 text-pink-400 border border-pink-500/30" : "text-white/40 hover:text-white/70"
          }`}
          title="Image Mode"
        >
          <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          onClick={() => onModeChange(mode === "video" ? "chat" : "video")}
          className={`p-1 sm:p-1.5 rounded-lg transition ${
            mode === "video" ? "bg-red-600/30 text-red-400 border border-red-500/30" : "text-white/40 hover:text-white/70"
          }`}
          title="Video Mode"
        >
          <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1 sm:p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition"
          title="Attach file"
        >
          <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md"
          onChange={handleFileUpload}
          className="hidden"
        />

        {onClear && (
          <button
            onClick={onClear}
            className="text-red-400/60 hover:text-red-400 transition text-[10px] sm:text-xs font-mono px-1 sm:px-2 py-0.5"
          >
            ✕ Clear
          </button>
        )}
      </div>

      <AnimatePresence>
        {file && previewUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3"
          >
            {file.type.startsWith("image/") && (
              <img src={previewUrl} alt="Preview" className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded-lg" />
            )}
            {file.type.startsWith("video/") && (
              <video src={previewUrl} className="w-8 h-8 sm:w-12 sm:h-12 object-cover rounded-lg" muted />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-white truncate">{file.name}</p>
              <p className="text-[10px] sm:text-xs text-white/30">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              onClick={clearFile}
              className="p-1 sm:p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CosmicPromptBar
        onSend={handleSend}
        isLoading={isLoading}
        placeholder={
          mode === "image"
            ? "Describe the image..."
            : mode === "video"
            ? "Describe the video..."
            : "Ask Siddhi anything..."
        }
        mode={mode}
      />
    </div>
  );
}
