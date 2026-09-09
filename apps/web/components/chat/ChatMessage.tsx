'use client';

import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Maximize2, Download, Pencil, X } from 'lucide-react';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date;
  isStreaming?: boolean;
  className?: string;
  onEdit?: (content: string) => void;
  messageId?: string;
}

function MediaToolbar({ src, alt, onEdit, isVideo = false }: any) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || (isVideo ? 'video.mp4' : 'image.png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handleEditSubmit = () => {
    if (editPrompt.trim() && onEdit) {
      onEdit(editPrompt);
      setIsEditing(false);
      setEditPrompt('');
    }
  };

  return (
    <>
      {isVideo ? (
        <video
          src={src}
          className={cn(
            "max-w-full rounded-lg transition-all duration-300",
            isFullscreen ? "fixed inset-0 z-50 w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain mx-auto my-auto" : ""
          )}
          controls
          autoPlay={false}
          playsInline
        />
      ) : (
        <img
          src={src}
          alt={alt || 'Generated media'}
          className={cn(
            "max-w-full rounded-lg transition-all duration-300 cursor-pointer",
            isFullscreen ? "fixed inset-0 z-50 w-auto h-auto max-w-[90vw] max-h-[90vh] object-contain mx-auto my-auto" : "hover:opacity-90"
          )}
          onClick={() => !isEditing && handleFullscreen()}
        />
      )}

      {isFullscreen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={handleFullscreen} />
      )}

      <div className={cn(
        "absolute bottom-2 right-2 flex gap-1 transition-opacity",
        isFullscreen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <button
          onClick={handleDownload}
          className="p-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-white/80 transition"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleFullscreen}
          className="p-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-white/80 transition"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        {onEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-black/70 hover:bg-black/90 rounded-lg text-white/80 transition"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>

      {isEditing && onEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-black/90 border border-cyan-500/20 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-white font-mono text-sm font-bold mb-2">Edit Media</h3>
            <p className="text-cyan-400/40 text-xs font-mono mb-3">
              Enter a new prompt to regenerate.
            </p>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g. 'Add more detail' or 'Make it cinematic'"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={!editPrompt.trim()}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-lg text-black text-sm font-medium transition"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const markdownComponents = {
  video({ src, ...props }: any) {
    return (
      <div className="relative group my-2">
        <MediaToolbar src={src} isVideo={true} alt="Video" />
      </div>
    );
  },
  audio({ src, ...props }: any) {
    return <audio src={src} controls className="w-full my-2" {...props} />;
  },
  img({ src, alt, ...props }: any) {
    return (
      <div className="relative group my-2">
        <MediaToolbar src={src} alt={alt} />
      </div>
    );
  },
};

export const ChatMessage = memo(function ChatMessage({
  content,
  role,
  timestamp,
  isStreaming = false,
  className,
  onEdit,
  messageId,
}: ChatMessageProps) {
  const safeContent = typeof content === 'string' ? content : String(content);
  const displayContent = safeContent.trim() || (role === 'assistant' ? '…' : '');

  const componentsWithEdit = {
    ...markdownComponents,
    img({ src, alt, ...props }: any) {
      return (
        <div className="relative group my-2">
          <MediaToolbar src={src} alt={alt} onEdit={onEdit} />
        </div>
      );
    },
    video({ src, ...props }: any) {
      return (
        <div className="relative group my-2">
          <MediaToolbar src={src} isVideo={true} onEdit={onEdit} alt="Video" />
        </div>
      );
    },
  };

  return (
    <div
      className={cn(
        'max-w-[85%] rounded-2xl px-4 py-3 relative',
        role === 'user'
          ? 'ml-auto bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/20 text-white shadow-[0_0_30px_rgba(0,255,255,0.05)]'
          : 'bg-white/5 border border-white/10 text-white/90 backdrop-blur-sm',
        isStreaming && 'border-cyan-500/40',
        className
      )}
    >
      {role === 'assistant' ? (
        <div className="prose prose-invert prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={onEdit ? componentsWithEdit : markdownComponents}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
      ) : (
        <span className="whitespace-pre-wrap break-words">{displayContent}</span>
      )}

      {timestamp && (
        <div className="text-[10px] text-white/30 mt-1 text-right">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </div>
  );
});
