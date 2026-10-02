'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Video, Play, Pause, Maximize2, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichMediaMessageProps {
  type: 'image' | 'video' | 'text' | 'mixed';
  content: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: string;
    size?: string;
  };
  onEdit?: (newContent: string) => void;
  isStreaming?: boolean;
}

export function RichMediaMessage({
  type,
  content,
  mediaUrl,
  thumbnailUrl,
  metadata,
  onEdit,
  isStreaming = false,
}: RichMediaMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      {/* Text Content */}
      {content && (
        <div className="prose prose-invert max-w-none">
          <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
            {content}
            {isStreaming && (
              <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-1 animate-pulse" />
            )}
          </p>
        </div>
      )}

      {/* Image Media */}
      {type === 'image' && mediaUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group rounded-xl overflow-hidden border border-white/10"
        >
          <img
            src={mediaUrl}
            alt="Generated image"
            className="w-full h-auto max-h-[600px] object-contain bg-black/50"
            loading="lazy"
          />
          
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {metadata?.size && (
                  <span className="text-white/60 text-xs bg-black/50 px-2 py-1 rounded">
                    {metadata.size}
                  </span>
                )}
                {metadata?.width && metadata.height && (
                  <span className="text-white/60 text-xs bg-black/50 px-2 py-1 rounded">
                    {metadata.width}×{metadata.height}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(mediaUrl, '_blank')}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = mediaUrl;
                    link.download = 'generated-image.png';
                    link.click();
                  }}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Video Media */}
      {type === 'video' && mediaUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/50"
        >
          {isPlaying ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="w-full max-h-[600px]"
              poster={thumbnailUrl}
            />
          ) : (
            <div className="relative aspect-video">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-cyan-900/50 flex items-center justify-center">
                  <Video className="w-16 h-16 text-white/30" />
                </div>
              )}
              
              {/* Play button overlay */}
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-16 h-16 rounded-full bg-cyan-500/90 flex items-center justify-center"
                >
                  <Play className="w-8 h-8 text-white ml-1" />
                </motion.div>
              </button>
              
              {/* Duration badge */}
              {metadata?.duration && (
                <div className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded text-xs text-white font-mono">
                  {metadata.duration}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-white/40 hover:text-white/80"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 mr-1" />
          ) : (
            <Copy className="w-3.5 h-3.5 mr-1" />
          )}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(content)}
            className="text-white/40 hover:text-white/80"
          >
            Edit & Regenerate
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Service recommendation card for contextual suggestions
 */
export function ServiceCard({
  title,
  description,
  price,
  imageUrl,
  category,
  onClick,
}: {
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,255,255,0.1)' }}
      onClick={onClick}
      className="glass rounded-xl p-4 cursor-pointer border border-white/10 hover:border-cyan-500/30 transition-all"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      )}
      
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-white font-medium text-sm">{title}</h4>
          <span className="text-cyan-400 font-bold text-sm">₹{price.toLocaleString()}</span>
        </div>
        
        <p className="text-white/50 text-xs line-clamp-2">{description}</p>
        
        <div className="flex items-center gap-2 pt-2">
          <span className="text-white/30 text-[10px] bg-white/5 px-2 py-0.5 rounded-full">
            {category}
          </span>
          <span className="text-cyan-400 text-[10px] font-medium">View Details →</span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Contextual suggestion chips
 */
export function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(suggestion)}
          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-white/70 hover:text-white text-xs transition-all"
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  );
}
