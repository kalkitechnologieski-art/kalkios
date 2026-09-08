'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles, Zap, Clock, Cpu } from 'lucide-react'

interface ThinkingLoaderProps {
  status: 'thinking' | 'done' | 'idle'
  reasoning?: string
  tokens?: number
  timeMs?: number
  steps?: string[]
  provider?: string
  className?: string
}

export function ThinkingLoader({
  status,
  reasoning = '',
  tokens = 0,
  timeMs = 0,
  steps = [],
  provider = '',
  className = '',
}: ThinkingLoaderProps) {
  const [expanded, setExpanded] = useState(false)

  const toggle = () => setExpanded(!expanded)

  const displaySteps = steps.length > 0 ? steps : reasoning.split('\n').filter(s => s.trim().length > 10)

  return (
    <div className={`flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm ${className}`}>
      {/* Andrew-Manzyk Loader */}
      <div className="flex-shrink-0">
        <div className="loader-andrew">
          <svg width="60" height="60" viewBox="0 0 100 100">
            <defs>
              <mask id="clipping-andrew">
                <polygon points="0,0 100,0 100,100 0,100" fill="black" />
                <polygon points="25,25 75,25 50,75" fill="white" />
                <polygon points="50,25 75,75 25,75" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
                <polygon points="35,35 65,35 50,65" fill="white" />
              </mask>
            </defs>
          </svg>
          <div className="box-andrew"></div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white font-mono">
              {status === 'thinking' ? 'Siddhi is thinking...' : 'Siddhi responded'}
            </span>
            {provider && (
              <span className="text-[10px] text-cyan-400/40 font-mono border border-cyan-500/10 px-1.5 py-0.5 rounded-full">
                {provider}
              </span>
            )}
          </div>
          <button
            onClick={toggle}
            className="text-white/30 hover:text-white/60 transition"
            title={expanded ? 'Collapse reasoning' : 'Expand reasoning'}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {status === 'thinking' && !expanded && (
          <div className="mt-1 text-xs text-white/40 font-mono animate-pulse">
            Processing your request...
          </div>
        )}

        {expanded && (
          <div className="mt-3 border-t border-white/5 pt-3">
            <div className="text-xs text-white/50 font-mono space-y-1 max-h-48 overflow-y-auto">
              {displaySteps.length > 0 ? (
                displaySteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 border-b border-white/5 pb-1">
                    <span className="text-cyan-400">●</span>
                    <span className="break-words">{step}</span>
                  </div>
                ))
              ) : (
                <div className="text-white/30">No reasoning steps available.</div>
              )}
            </div>
            {(tokens > 0 || timeMs > 0) && (
              <div className="flex items-center gap-4 mt-2 text-[10px] text-white/30 font-mono">
                {tokens > 0 && (
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> {tokens} tokens
                  </span>
                )}
                {timeMs > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeMs}ms
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS for Andrew-Manzyk loader */}
      <style jsx>{`
        .loader-andrew {
          --color-one: #00ffff;
          --color-two: #8b5cf6;
          --color-three: rgba(0, 255, 255, 0.5);
          --color-four: rgba(139, 92, 246, 0.5);
          --color-five: rgba(0, 255, 255, 0.25);
          --time-animation: 2s;
          position: relative;
          border-radius: 50%;
          transform: scale(0.6);
          transform-origin: center;
          box-shadow: 0 0 25px 0 var(--color-three), 0 20px 50px 0 var(--color-four);
          animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
          width: 60px;
          height: 60px;
        }
        .loader-andrew::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border-top: solid 2px var(--color-one);
          border-bottom: solid 2px var(--color-two);
          background: linear-gradient(180deg, var(--color-five), var(--color-four));
          box-shadow: inset 0 10px 10px 0 var(--color-three), inset 0 -10px 10px 0 var(--color-four);
        }
        .loader-andrew .box-andrew {
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, var(--color-one) 30%, var(--color-two) 70%);
          mask: url(#clipping-andrew);
          -webkit-mask: url(#clipping-andrew);
        }
        .loader-andrew svg {
          position: absolute;
          width: 60px;
          height: 60px;
        }
        .loader-andrew svg #clipping-andrew {
          filter: contrast(15);
          animation: roundness calc(var(--time-animation) / 2) linear infinite;
        }
        .loader-andrew svg #clipping-andrew polygon {
          filter: blur(7px);
        }
        .loader-andrew svg #clipping-andrew polygon:nth-child(1) {
          transform-origin: 75% 25%;
          transform: rotate(90deg);
        }
        .loader-andrew svg #clipping-andrew polygon:nth-child(2) {
          transform-origin: 50% 50%;
          animation: rotation var(--time-animation) linear infinite reverse;
        }
        .loader-andrew svg #clipping-andrew polygon:nth-child(3) {
          transform-origin: 50% 60%;
          animation: rotation var(--time-animation) linear infinite;
          animation-delay: calc(var(--time-animation) / -3);
        }
        .loader-andrew svg #clipping-andrew polygon:nth-child(4) {
          transform-origin: 40% 40%;
          animation: rotation var(--time-animation) linear infinite reverse;
        }
        .loader-andrew svg #clipping-andrew polygon:nth-child(5) {
          transform-origin: 40% 40%;
          animation: rotation var(--time-animation) linear infinite reverse;
          animation-delay: calc(var(--time-animation) / -2);
        }
        .loader-andrew svg #clipping-andrew polygon:nth-child(6) {
          transform-origin: 60% 40%;
          animation: rotation var(--time-animation) linear infinite;
        }
        .loader-andrew svg #clipping-andrew polygon:nth-child(7) {
          transform-origin: 60% 40%;
          animation: rotation var(--time-animation) linear infinite;
          animation-delay: calc(var(--time-animation) / -1.5);
        }
        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes roundness {
          0% { filter: contrast(15); }
          20% { filter: contrast(3); }
          40% { filter: contrast(3); }
          60% { filter: contrast(15); }
          100% { filter: contrast(15); }
        }
        @keyframes colorize {
          0% { filter: hue-rotate(0deg); }
          20% { filter: hue-rotate(-30deg); }
          40% { filter: hue-rotate(-60deg); }
          60% { filter: hue-rotate(-90deg); }
          80% { filter: hue-rotate(-45deg); }
          100% { filter: hue-rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
