// ═══ SIDDHI v4.0 BATCH 3 v1.0 ═══
// ChatMessage with artifacts, citations, tool calls, and read-aloud.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { memo, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Maximize2, Download, Volume2, VolumeX, Copy, Check } from 'lucide-react';

export interface ArtifactItem {
  type: 'react' | 'html' | 'svg' | 'markdown' | 'code';
  language?: string;
  title: string;
  content: string;
}

export interface CitationItem {
  id: number;
  title: string;
  url: string;
  snippet: string;
}

export interface ToolCallItem {
  name: string;
  args: unknown;
  result: unknown;
}

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date;
  isStreaming?: boolean;
  className?: string;
  onEdit?: (content: string) => void;
  messageId?: string;
  artifacts?: ArtifactItem[];
  citations?: CitationItem[];
  toolCalls?: ToolCallItem[];
}

interface MediaToolbarProps { src?: string; alt?: string; isVideo?: boolean; }

function MediaToolbar({ src = '', alt = '', isVideo = false }: MediaToolbarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    if (typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || (isVideo ? 'video.mp4' : 'image.png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = (e: React.MouseEvent) => { e.stopPropagation(); setIsFullscreen((v) => !v); };

  return (
    <>
      {isVideo ? (
        <video src={src} className={cn('max-w-full rounded-lg', isFullscreen && 'fixed inset-0 z-50 max-w-[90vw] max-h-[90vh] m-auto')} controls playsInline />
      ) : (
        <img src={src} alt={alt || 'Media'} className={cn('max-w-full rounded-lg cursor-pointer', isFullscreen && 'fixed inset-0 z-50 max-w-[90vw] max-h-[90vh] m-auto')} onClick={() => setIsFullscreen(true)} />
      )}
      {isFullscreen && <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setIsFullscreen(false)} />}
      <div className={cn('absolute bottom-2 right-2 flex gap-1 transition-opacity', isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
        <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="p-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-white/80 transition" title="Download"><Download className="w-4 h-4" /></button>
        <button onClick={handleFullscreen} className="p-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-white/80 transition" title="Fullscreen"><Maximize2 className="w-4 h-4" /></button>
      </div>
    </>
  );
}

function ArtifactBlock({ artifact }: { artifact: ArtifactItem }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');

  if (artifact.type === 'svg') {
    return (
      <div className="my-3 rounded-xl overflow-hidden border border-cyan-500/20 bg-black/40">
        <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/10 bg-white/5">
          <span className="text-xs text-cyan-400 font-mono">{artifact.title}</span>
          <span className="text-[10px] text-white/30">SVG</span>
        </div>
        <div className="p-3 flex justify-center" dangerouslySetInnerHTML={{ __html: artifact.content }} />
      </div>
    );
  }

  if (artifact.type === 'html' || artifact.type === 'react') {
    return (
      <div className="my-3 rounded-xl overflow-hidden border border-cyan-500/20 bg-black/40">
        <div className="flex items-center border-b border-cyan-500/10 bg-white/5">
          <button onClick={() => setTab('preview')} className={cn('px-3 py-1.5 text-xs font-mono', tab === 'preview' ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/40')}>Preview</button>
          <button onClick={() => setTab('code')} className={cn('px-3 py-1.5 text-xs font-mono', tab === 'code' ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/40')}>Code</button>
          <span className="ml-auto pr-3 text-[10px] text-white/30">{artifact.type.toUpperCase()}</span>
        </div>
        {tab === 'preview' ? (
          <iframe srcDoc={artifact.content} className="w-full h-96 bg-white" sandbox="allow-scripts" title={artifact.title} />
        ) : (
          <pre className="p-3 text-xs font-mono text-white/80 overflow-x-auto max-h-96"><code>{artifact.content}</code></pre>
        )}
      </div>
    );
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-cyan-500/20 bg-black/40">
      <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/10 bg-white/5">
        <span className="text-xs text-cyan-400 font-mono">{artifact.title}</span>
        <span className="text-[10px] text-white/30">{(artifact.language ?? artifact.type).toUpperCase()}</span>
      </div>
      <pre className="p-3 text-xs font-mono text-white/80 overflow-x-auto max-h-96"><code>{artifact.content}</code></pre>
    </div>
  );
}

function SpeakButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    if (speaking) { synth.cancel(); setSpeaking(false); return; }

    const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000));
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button onClick={speak} className={cn('p-1 rounded hover:bg-white/5 transition', speaking ? 'text-cyan-400' : 'text-white/30 hover:text-white/60')} title={speaking ? 'Stop reading' : 'Read aloud'}>
      {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <button onClick={copy} className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

const markdownComponents: Components = {
  video({ src }) {
    const url = typeof src === 'string' ? src : undefined;
    return <div className="relative group my-2"><MediaToolbar src={url} isVideo /></div>;
  },
  audio({ src }) {
    const url = typeof src === 'string' ? src : undefined;
    return <audio src={url} controls className="w-full my-2" />;
  },
  img({ src, alt }) {
    const url = typeof src === 'string' ? src : undefined;
    return <div className="relative group my-2"><MediaToolbar src={url} alt={alt} /></div>;
  },
};

export const ChatMessage = memo(function ChatMessage({
  content, role, timestamp, isStreaming = false, className,
  onEdit, messageId, artifacts, citations, toolCalls,
}: ChatMessageProps) {
  const safeContent = typeof content === 'string' ? content : String(content);
  const displayContent = safeContent.trim() || (role === 'assistant' ? '…' : '');
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState(safeContent);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      }
    };
  }, []);

  const submitEdit = () => {
    if (editValue.trim() && onEdit) { onEdit(editValue); setEditOpen(false); }
  };

  return (
    <div
      className={cn(
        'max-w-[85%] rounded-2xl px-4 py-3 relative group',
        role === 'user'
          ? 'ml-auto bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/20 text-white shadow-[0_0_30px_rgba(0,255,255,0.05)]'
          : 'bg-white/5 border border-white/10 text-white/90 backdrop-blur-sm',
        isStreaming && 'border-cyan-500/40',
        className
      )}
      data-message-id={messageId}
    >
      {role === 'assistant' ? (
        <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{displayContent}</ReactMarkdown>
        </div>
      ) : (
        <span className="whitespace-pre-wrap break-words">{displayContent}</span>
      )}

      {artifacts && artifacts.length > 0 && (
        <div className="mt-3 space-y-2">{artifacts.map((a, i) => <ArtifactBlock key={i} artifact={a} />)}</div>
      )}

      {citations && citations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-xs text-cyan-400/60 font-mono mb-2">📚 Sources</p>
          <ol className="space-y-1 text-xs">
            {citations.map((c) => (
              <li key={c.id} className="text-white/60">
                <span className="text-cyan-400">[{c.id}]</span>{' '}
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 underline">{c.title}</a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {toolCalls && toolCalls.length > 0 && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-white/40 hover:text-white/60 font-mono">🔧 {toolCalls.length} tool call(s)</summary>
          <div className="mt-2 space-y-1 pl-3 border-l border-white/10">
            {toolCalls.map((t, i) => (
              <div key={i} className="font-mono text-white/50">
                <span className="text-cyan-400">{t.name}</span>
                <div className="text-[10px] text-white/30 ml-2">→ {JSON.stringify(t.result).slice(0, 120)}</div>
              </div>
            ))}
          </div>
        </details>
      )}

      {role === 'assistant' && !isStreaming && displayContent !== '…' && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5 justify-end">
          <SpeakButton text={safeContent} />
          <CopyButton text={safeContent} />
        </div>
      )}

      {role === 'user' && onEdit && (
        <button
          onClick={() => { setEditValue(safeContent); setEditOpen(true); }}
          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition p-1 rounded-full bg-black/60 text-white/60 hover:text-white"
          title="Edit"
        >
          ✎
        </button>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-black/90 border border-cyan-500/20 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-white font-mono text-sm font-bold mb-2">Edit message</h3>
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setEditOpen(false)} className="px-4 py-1.5 bg-white/5 rounded-lg text-white/60 text-sm">Cancel</button>
              <button onClick={submitEdit} disabled={!editValue.trim()} className="px-4 py-1.5 bg-cyan-600 disabled:opacity-50 rounded-lg text-black text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {timestamp && (
        <div className="text-[10px] text-white/30 mt-1 text-right">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
});
