"use client";

import { useState } from "react";
import { ChevronDown, Brain } from "lucide-react";

export function ThinkingTrace({ reasoning, tokens, timeMs, status, provider }: any) {
  const [expanded, setExpanded] = useState(false);
  if (!reasoning) return null;

  return (
    <div className="mt-2 border border-cyan-500/10 rounded-xl bg-black/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-white/60 font-mono">Reasoning</span>
          {provider && (
            <span className="text-[10px] text-cyan-400/40 font-mono border border-cyan-500/10 px-1.5 py-0.5 rounded-full">
              {provider}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
          {tokens && <span>{tokens} tokens</span>}
          {timeMs && <span>{timeMs}ms</span>}
          <ChevronDown className={`w-4 h-4 text-white/30 transition ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {expanded && (
        <div className="p-3 pt-0 border-t border-white/5">
          <div className="text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed">
            {reasoning}
          </div>
        </div>
      )}
    </div>
  );
}
