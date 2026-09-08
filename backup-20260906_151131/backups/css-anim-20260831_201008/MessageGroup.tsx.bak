'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageActions } from './MessageActions';
import { EditableMessage } from './EditableMessage';
import { ThinkingTrace } from './ThinkingTrace';
import { SetuProgress } from './SetuProgress';
import { ChatMessage } from './ChatMessage';
import { cn } from '@/lib/utils';

interface MessageGroupProps {
  id: string;
  userMessage: { id: string; content: string; timestamp: Date } | null;
  assistantMessage: { id: string; content: string; reasoning?: string; timestamp: Date; provider?: string; tokens?: number; leads?: any[]; csv?: string; questions?: string[] } | null;
  isStreaming?: boolean;
  onEditUser: (newContent: string) => void;
  onRegenerate: () => void;
  onCopy: (content: string) => void;
  onFeedback: (rating: 'up' | 'down') => void;
  className?: string;
}

export function MessageGroup({
  id,
  userMessage,
  assistantMessage,
  isStreaming = false,
  onEditUser,
  onRegenerate,
  onCopy,
  onFeedback,
  className,
}: MessageGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null);

  if (!userMessage && !assistantMessage) return null;

  return (
    <motion.div
      ref={groupRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('space-y-3 py-2', className)}
    >
      {/* User Message */}
      {userMessage && (
        <div className="flex justify-end">
          <div className="max-w-[85%] bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/20 rounded-2xl px-4 py-3 text-white shadow-[0_0_30px_rgba(0,255,255,0.05)]">
            <EditableMessage
              content={userMessage.content}
              onSave={onEditUser}
            />
            <div className="text-[10px] text-white/30 mt-1 text-right">
              {userMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}

      {/* Assistant Message */}
      {assistantMessage && (
        <div className="flex justify-start">
          <div className="max-w-[85%] bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white/90 backdrop-blur-sm">
            <ChatMessage
              content={assistantMessage.content}
              role="assistant"
              timestamp={assistantMessage.timestamp}
              isStreaming={isStreaming}
            />

            {assistantMessage.reasoning && (
              <div className="mt-2">
                <ThinkingTrace
                  reasoning={assistantMessage.reasoning}
                  tokens={assistantMessage.tokens}
                  timeMs={0}
                  status={isStreaming ? 'thinking' : 'done'}
                  provider={assistantMessage.provider}
                />
              </div>
            )}

            {assistantMessage.leads && assistantMessage.leads.length > 0 && (
              <div className="mt-2">
                <SetuProgress
                  leads={assistantMessage.leads}
                  csv={assistantMessage.csv || ''}
                  isLoading={false}
                />
              </div>
            )}

            {assistantMessage.questions && assistantMessage.questions.length > 0 && (
              <div className="mt-2 bg-white/5 border border-cyan-500/10 rounded-xl p-3">
                <p className="text-white/60 text-sm font-mono">Please answer:</p>
                <ul className="list-disc list-inside text-cyan-400/80 text-sm mt-1 space-y-1">
                  {assistantMessage.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {!isStreaming && assistantMessage.content && (
              <MessageActions
                content={assistantMessage.content}
                onRegenerate={onRegenerate}
                onFeedback={onFeedback}
                className="mt-2"
              />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
