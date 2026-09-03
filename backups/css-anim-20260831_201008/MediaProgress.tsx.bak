"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Stage {
  progress: number;
  text: string;
}

interface MediaProgressProps {
  isLoading: boolean;
  mode: "image" | "video";
  onComplete?: () => void;
}

const STAGES: Stage[] = [
  { progress: 10, text: "Analyzing..." },
  { progress: 25, text: "Initializing..." },
  { progress: 45, text: "Generating..." },
  { progress: 70, text: "Refining..." },
  { progress: 90, text: "Finalizing..." },
];

export function MediaProgress({ isLoading, mode, onComplete }: MediaProgressProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing...");

  useEffect(() => {
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

    let currentStage = 0;
    let intervalId: NodeJS.Timeout | null = null;

    intervalId = setInterval(() => {
      setProgress((prev) => {
        const stage = currentStage < STAGES.length ? STAGES[currentStage] : null;
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
  }, [isLoading, onComplete]);

  if (!isLoading && progress === 0) return null;

  const isImage = mode === "image";

  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-2.5 sm:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <span className="text-[10px] sm:text-sm text-white/60 font-mono flex items-center gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-base">{isImage ? "🖼️" : "🎬"}</span>
          <span className="hidden xs:inline">{isImage ? "Generating Image" : "Generating Video"}</span>
          <span className="inline xs:hidden">{isImage ? "Image" : "Video"}</span>
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
