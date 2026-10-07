"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Stage {
  progress: number;
  text: string;
}

interface MediaProgressProps {
  isLoading: boolean;
  mode: "image" | "video" | "leads";
  onComplete?: () => void;
  livePercent?: number;
  liveMessage?: string;
}

const STAGES: Record<MediaProgressProps["mode"], Stage[]> = {
  image: [
    { progress: 10, text: "Analyzing prompt..." },
    { progress: 25, text: "Initializing model..." },
    { progress: 45, text: "Generating..." },
    { progress: 70, text: "Refining details..." },
    { progress: 90, text: "Finalizing..." },
  ],
  video: [
    { progress: 10, text: "Analyzing prompt..." },
    { progress: 25, text: "Planning scenes..." },
    { progress: 45, text: "Rendering frames..." },
    { progress: 70, text: "Refining motion..." },
    { progress: 90, text: "Encoding video..." },
  ],
  leads: [
    { progress: 10, text: "Discovering sources..." },
    { progress: 30, text: "Scraping websites..." },
    { progress: 50, text: "Enriching contacts..." },
    { progress: 70, text: "Scoring & deduping..." },
    { progress: 90, text: "Compiling results..." },
  ],
};

const MODE_META: Record<MediaProgressProps["mode"], { emoji: string; label: string; short: string }> = {
  image: { emoji: "🖼️", label: "Generating Image", short: "Image" },
  video: { emoji: "🎬", label: "Generating Video", short: "Video" },
  leads: { emoji: "📊", label: "Finding Leads", short: "Leads" },
};

export function MediaProgress({ isLoading, mode, onComplete, livePercent, liveMessage }: MediaProgressProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");

  const usingLive = typeof livePercent === 'number' && typeof liveMessage === 'string' && liveMessage.length > 0;

  useEffect(() => {
    if (usingLive) {
      setProgress(Math.min(100, Math.max(0, livePercent ?? 0)));
      setStatusText(liveMessage ?? '');
      return;
    }
    if (!isLoading) {
      setProgress(100);
      setStatusText("Complete!");
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }

    setProgress(0);
    setStatusText("Connecting to AI...");

    const stages = STAGES[mode];
    let currentStage = 0;
    let intervalId: NodeJS.Timeout | null = null;

    intervalId = setInterval(() => {
      setProgress((prev) => {
        const stage = currentStage < stages.length ? stages[currentStage] : null;
        if (stage && prev >= stage.progress - 2) {
          setStatusText(stage.text);
          currentStage++;
          return stage.progress;
        }
        const next = prev + 1;
        return next >= 95 ? 95 : next;
      });
    }, 300);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading, onComplete, mode, usingLive, livePercent, liveMessage]);

  if (!isLoading && progress === 0) return null;

  const meta = MODE_META[mode];

  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-2.5 sm:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <span className="text-[10px] sm:text-sm text-white/60 font-mono flex items-center gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-base">{meta.emoji}</span>
          <span className="hidden xs:inline">{meta.label}</span>
          <span className="inline xs:hidden">{meta.short}</span>
        </span>
        <span className="text-xs sm:text-sm text-cyan-400 font-mono font-bold">{progress}%</span>
      </div>

      <div className="relative w-full h-2 sm:h-2.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-0 h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #00ffff, #8b5cf6, #ff0066, #00ffff)",
            backgroundSize: "300% 100%",
            width: `${progress}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <div
          className="absolute inset-0 h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, rgba(0,255,255,0.3), rgba(139,92,246,0.3), rgba(255,0,102,0.3))",
            filter: "blur(4px)",
            width: `${progress}%`,
          }}
        />
      </div>

      <p className="text-[10px] sm:text-xs text-cyan-400/40 font-mono mt-1.5 sm:mt-2 animate-pulse">
        {statusText}
      </p>
    </div>
  );
}
