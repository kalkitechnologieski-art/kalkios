'use client';

import { useState } from 'react';
import { Copy, RotateCcw, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageActionsProps {
  content: string;
  onRegenerate?: () => void;
  onFeedback?: (rating: 'up' | 'down') => void;
  className?: string;
}

export function MessageActions({ content, onRegenerate, onFeedback, className }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFeedback = (rating: 'up' | 'down') => {
    setFeedback(rating);
    onFeedback?.(rating);
  };

  return (
    <div className={`flex items-center gap-1 mt-2 text-white/30 ${className}`}>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded hover:bg-white/5 transition group"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 group-hover:text-white/60 transition" />
        )}
      </button>

      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="p-1.5 rounded hover:bg-white/5 transition group"
          title="Regenerate response"
        >
          <RotateCcw className="w-4 h-4 group-hover:text-white/60 transition" />
        </button>
      )}

      <div className="flex items-center gap-0.5 ml-1">
        <button
          onClick={() => handleFeedback('up')}
          className={`p-1.5 rounded hover:bg-white/5 transition ${
            feedback === 'up' ? 'text-green-400' : 'text-white/30 hover:text-white/60'
          }`}
          title="Good response"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleFeedback('down')}
          className={`p-1.5 rounded hover:bg-white/5 transition ${
            feedback === 'down' ? 'text-red-400' : 'text-white/30 hover:text-white/60'
          }`}
          title="Bad response"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
