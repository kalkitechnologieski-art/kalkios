'use client';
import { useState } from 'react';
import { ChevronDown, Brain } from 'lucide-react';

export function ReasoningTrace({ reasoning, sources }: { reasoning: string; sources?: any[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!reasoning) return null;
  return (
    <div className="mt-2 border border-cyan-500/10 rounded-xl bg-black/30 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition">
        <div className="flex items-center gap-3">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-white/60 font-mono">Reasoning</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="p-3 pt-0 border-t border-white/5">
          <div className="text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed">{reasoning}</div>
          {sources && sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((s, i) => (
                <a key={i} href={s.link} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400/60 hover:text-cyan-400 underline underline-offset-2">{s.title || `Source ${i+1}`}</a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
