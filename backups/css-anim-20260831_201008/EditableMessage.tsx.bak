'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditableMessageProps {
  content: string;
  onSave: (newContent: string) => void;
  className?: string;
}

export function EditableMessage({ content, onSave, className }: EditableMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    if (editedContent.trim()) {
      onSave(editedContent);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <div className={`relative group ${className}`}>
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-cyan-500/50 resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              className="p-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-400 transition"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <span className="whitespace-pre-wrap break-words flex-1">{content}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60"
            title="Edit message"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
