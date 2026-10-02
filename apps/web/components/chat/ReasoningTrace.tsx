// ═══ SIDDHI v4.0 BATCH 2 ═══
// Reasoning trace with live step list and confidence badge.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState } from 'react';
import { Brain, ChevronDown, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export interface ReasoningStep {
  id: string;
  type: string;
  status: 'running' | 'completed' | 'failed' | string;
  message: string;
  duration?: number;
}

interface ReasoningTraceProps {
  reasoning?: string;
  sources?: Array<{ title?: string; url?: string; link?: string }>;
  steps?: ReasoningStep[];
  confidence?: number;
  className?: string;
}

export function ReasoningTrace({ reasoning, sources, steps, confidence, className }: ReasoningTraceProps) {
  const [expanded, setExpanded] = useState(false);

  const hasSteps = Array.isArray(steps) && steps.length > 0;
  const hasReasoning = typeof reasoning === 'string' && reasoning.length > 0;
  if (!hasSteps && !hasReasoning) return null;

  const completed = steps?.filter((s) => s.status === 'completed').length ?? 0;
  const total = steps?.length ?? 0;

  return (
    <div className={`mt-2 border border-cyan-500/10 rounded-xl bg-black/30 overflow-hidden ${className ?? ''}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition">
        <div className="flex items-center gap-3">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-white/60 font-mono">Reasoning</span>
          {total > 0 && <span className="text-[10px] text-cyan-400/40 font-mono">{completed}/{total}</span>}
          {typeof confidence === 'number' && (
            <span className={`text-[10px] font-mono ${confidence > 0.8 ? 'text-green-400' : confidence > 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
              {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-white/30 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="p-3 pt-0 border-t border-white/5 space-y-2">
          {steps?.map((step) => (
            <div key={step.id} className="flex items-start gap-2 text-xs">
              {step.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-400 mt-0.5" />}
              {step.status === 'running' && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin mt-0.5" />}
              {step.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-400 mt-0.5" />}
              <div className="flex-1">
                <span className="text-white/70 font-mono">{step.message}</span>
                {step.duration ? <span className="text-white/30 ml-2">({step.duration}ms)</span> : null}
              </div>
            </div>
          ))}
          {hasReasoning && (
            <div className="text-xs text-white/60 whitespace-pre-wrap font-mono leading-relaxed pt-2 border-t border-white/5">{reasoning}</div>
          )}
          {sources && sources.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
              {sources.map((s, i) => (
                <a key={i} href={s.url ?? s.link ?? '#'} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-400/60 hover:text-cyan-400 underline">
                  [{i + 1}] {s.title ?? `Source ${i + 1}`}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
