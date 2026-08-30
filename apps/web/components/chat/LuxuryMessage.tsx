'use client';

import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface LuxuryMessageProps {
  children: ReactNode;
  role: "user" | "assistant" | "system";
  timestamp?: Date;
  className?: string;
  isStreaming?: boolean;
}

export function LuxuryMessage({ children, role, timestamp, className = "", isStreaming = false }: LuxuryMessageProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  // Convert children to string for markdown
  const content = typeof children === "string" ? children : String(children);

  // System messages are centered with special styling
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-400/80 font-mono max-w-[90%] backdrop-blur-sm">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col max-w-[85%] rounded-2xl px-4 py-3 relative",
        isUser
          ? "ml-auto bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/20 text-white shadow-[0_0_30px_rgba(0,255,255,0.05)]"
          : "bg-white/5 border border-white/10 text-white/90 backdrop-blur-sm",
        isStreaming && "border-cyan-500/40",
        className
      )}
    >
      {isUser ? (
        <span className="whitespace-pre-wrap break-words">{content}</span>
      ) : (
        <div className="prose prose-invert prose-sm max-w-none dark:prose-invert break-words">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
      {timestamp && (
        <div className="text-[10px] text-white/30 mt-1 text-right">
          {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}
    </div>
  );
}
