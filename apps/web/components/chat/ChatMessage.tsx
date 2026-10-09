// ═══ SIDDHI v4.0 BATCH 3 v1.0 ═══
// ChatMessage with artifacts, citations, tool calls, and read-aloud.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2, Download, Share2, X, Volume2, VolumeX, Copy, Check, Loader2 } from 'lucide-react';
import { useSmoothText } from '@/hooks/useSmoothText';

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

/** Cross-origin-safe download: fetch → blob → objectURL. Falls back to a
 *  same-tab navigation when CORS blocks the fetch (rare for provider CDNs). */
async function downloadMedia(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 4000);
  } catch {
    // CORS/opaque response — open in a new tab so the user can still save.
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function MediaToolbar({ src = '', alt = '', isVideo = false }: MediaToolbarProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [nativeFs, setNativeFs] = useState(false);
  const [overlay, setOverlay] = useState(false);        // iOS / no-Fullscreen-API fallback
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(1);
  const sentinelRef = useRef(false);                      // did we push a history entry?

  const isExpanded = nativeFs || overlay;

  const clearTransform = () => setScale(1);

  // Enter OS-level fullscreen; if unavailable (iOS Safari), use an overlay and
  // wire the hardware/gesture back button to a history sentinel.
  const enter = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    const req = el.requestFullscreen?.bind(el)
      ?? (el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen?.bind(el as unknown as Element);
    if (req) {
      try {
        await req();
        setNativeFs(true);
        return;
      } catch { /* permission/policy denied → fall through to overlay */ }
    }
    setOverlay(true);
    clearTransform();
    if (typeof window !== 'undefined' && !sentinelRef.current) {
      window.history.pushState({ __mediaOverlay: true }, '');
      sentinelRef.current = true;
    }
  }, []);

  const exit = useCallback(() => {
    const doc = document as Document & {
      exitFullscreen?: () => Promise<void>;
      webkitExitFullscreen?: () => Promise<void>;
    };
    if (nativeFs && (document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: unknown }).webkitFullscreenElement)) {
      const doExit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc);
      try { void doExit?.(); } catch { /* ignore */ }
    }
    if (overlay && sentinelRef.current) {
      sentinelRef.current = false;
      // Pop our own sentinel so a later hardware-back doesn't misfire.
      try { window.history.back(); } catch { /* ignore */ }
    }
    setNativeFs(false);
    setOverlay(false);
    clearTransform();
  }, [nativeFs, overlay]);

  const toggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isExpanded) exit(); else void enter();
  };

  // Reflect browser-driven fullscreen exits (ESC / Android back) in our state.
  useEffect(() => {
    const onChange = () => {
      const active = !!(document.fullscreenElement
        || (document as unknown as { webkitFullscreenElement?: unknown }).webkitFullscreenElement);
      setNativeFs(active);
      if (!active) clearTransform();
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange as EventListener);
    };
  }, []);

  // ESC (overlay) + hardware back (overlay sentinel → popstate).
  useEffect(() => {
    if (!overlay) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') exit(); };
    const onPop = () => { if (sentinelRef.current) { sentinelRef.current = false; exit(); } };
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
    };
  }, [overlay, exit]);

  const onWheel = (e: React.WheelEvent) => {
    if (!isExpanded || isVideo) return;
    e.preventDefault();
    setScale((s) => Math.min(5, Math.max(1, s + (e.deltaY < 0 ? 0.2 : -0.2))));
  };

  const filename = alt?.trim() || (isVideo ? 'kalki-video.mp4' : 'kalki-image.png');

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!src) return;
    setBusy(true);
    try { await downloadMedia(src, filename); }
    finally { setTimeout(() => setBusy(false), 600); }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'KALKI OS', url: src }); } catch { /* dismissed */ }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try { await navigator.clipboard.writeText(src); } catch { /* ignore */ }
    }
  };

  const btn = 'p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white/85 hover:text-white transition backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 disabled:opacity-50';

  const media = isVideo ? (
    <video
      src={src}
      className={cn('max-w-full rounded-lg', isExpanded && 'max-h-full w-auto object-contain')}
      controls
      playsInline
    />
  ) : (
    <img
      src={src}
      alt={alt || 'Media'}
      onClick={() => { if (!isExpanded) void enter(); }}
      onDoubleClick={toggle}
      style={isExpanded && scale > 1 ? { transform: `scale(${scale})`, transformOrigin: 'center', cursor: 'zoom-out' } : undefined}
      className={cn('max-w-full rounded-lg cursor-zoom-in transition-transform', isExpanded && 'max-h-full w-auto object-contain')}
    />
  );

  // ONE persistent container so toggling expand never remounts the media and
  // drops the native fullscreen element.
  return (
    <div
      ref={stageRef}
      onWheel={onWheel}
      role={isExpanded ? 'dialog' : undefined}
      aria-modal={isExpanded ? true : undefined}
      aria-label={isVideo ? 'Video viewer' : 'Image viewer'}
      className={cn(
        'group',
        isExpanded
          ? 'fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md'
          : 'relative inline-block',
      )}
    >
      <div className={cn(isExpanded && 'flex-1 min-h-0 w-full flex items-center justify-center p-4')}>
        {media}
      </div>

      {isExpanded ? (
        <div className="flex items-center gap-2 pb-6 pt-2 px-4">
          <button onClick={handleDownload} disabled={busy} className={btn} title="Download" aria-label="Download">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          <button onClick={handleShare} className={btn} title="Share" aria-label="Share">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={toggle} className={btn} title="Exit (Esc)" aria-label="Exit fullscreen">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={toggle} className={btn} title="Close (Esc)" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
          {!isVideo && (
            <span className="text-white/40 text-xs font-mono ml-2 hidden sm:inline">
              scroll to zoom{scale !== 1 ? ` · ${Math.round(scale * 100)}%` : ''}
            </span>
          )}
          <span className="ml-auto text-white/30 text-[11px] font-mono hidden sm:inline">Esc / ← to exit</span>
        </div>
      ) : (
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button onClick={handleDownload} disabled={busy} className={btn} title="Download" aria-label="Download">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          <button onClick={toggle} className={btn} title="Fullscreen" aria-label="Fullscreen">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
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
    return <div className="my-2"><MediaToolbar src={url} isVideo /></div>;
  },
  audio({ src }) {
    const url = typeof src === 'string' ? src : undefined;
    return <audio src={url} controls className="w-full my-2" />;
  },
  img({ src, alt }) {
    const url = typeof src === 'string' ? src : undefined;
    return <div className="my-2"><MediaToolbar src={url} alt={alt} /></div>;
  },
};

export const ChatMessage = memo(function ChatMessage({
  content, role, timestamp, isStreaming = false, className,
  onEdit, messageId, artifacts, citations, toolCalls,
}: ChatMessageProps) {
  const safeContent = typeof content === 'string' ? content : String(content);
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState(safeContent);

  // Letter-by-letter reveal decoupled from SSE burst arrival.
  const shown = useSmoothText(safeContent, isStreaming);
  const assistantContent = shown.trim() || (isStreaming ? '' : '…');
  const displayContent = role === 'assistant' ? assistantContent : (safeContent.trim());

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
          {isStreaming && (
            <span className="typing-caret" aria-hidden="true" />
          )}
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
