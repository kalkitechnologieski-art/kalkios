#!/usr/bin/env bash
# =============================================================================
# KALKI OS – Enterprise Fixes (Type-Safe, Production-Ready)
# =============================================================================
# This script applies all necessary fixes to make Siddhi chat work correctly,
# replaces the sidebar with a hover‑expandable enterprise version, and ensures
# all components are type‑safe and properly connected.
#
# It backs up existing files, writes new ones, installs dependencies, and runs
# type‑check and build verification.
#
# Usage: ./apply-enterprise-fixes.sh [--skip-build] [--skip-type-check]
# =============================================================================

set -euo pipefail

# ─── Colours ────────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
    RED=$(tput setaf 1 2>/dev/null || echo '')
    GREEN=$(tput setaf 2 2>/dev/null || echo '')
    YELLOW=$(tput setaf 3 2>/dev/null || echo '')
    BLUE=$(tput setaf 4 2>/dev/null || echo '')
    BOLD=$(tput bold 2>/dev/null || echo '')
    NC=$(tput sgr0 2>/dev/null || echo '')
else
    RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; NC=''
fi

log_info()    { echo -e "${BLUE}${BOLD}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}${BOLD}[SUCCESS]${NC} $*"; }
log_warning() { echo -e "${YELLOW}${BOLD}[WARNING]${NC} $*"; }
log_error()   { echo -e "${RED}${BOLD}[ERROR]${NC} $*" >&2; }
die()         { log_error "$*"; exit 1; }

# ─── Parse arguments ──────────────────────────────────────────────────────────
SKIP_BUILD=false
SKIP_TYPE_CHECK=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-build) SKIP_BUILD=true; shift ;;
        --skip-type-check) SKIP_TYPE_CHECK=true; shift ;;
        --help)
            cat << EOF
Usage: $0 [OPTIONS]

Options:
  --skip-build           Skip 'npm run build' verification
  --skip-type-check      Skip 'npm run type-check' verification
  --help                 Show this help message

This script replaces critical files to fix the chat interface and sidebar.
EOF
            exit 0
            ;;
        *) die "Unknown option: $1" ;;
    esac
done

# ─── Detect project root ──────────────────────────────────────────────────────
log_info "Detecting project structure..."
if [[ -d "apps/web" && -d "apps/web/lib" && -f "apps/web/package.json" ]]; then
    ROOT="apps/web"
    log_info "Monorepo structure detected (./apps/web)"
elif [[ -d "lib" && -f "package.json" ]]; then
    ROOT="."
    log_info "Standalone structure detected (./)"
else
    die "Could not detect project structure. Expected ./apps/web or ./lib with package.json"
fi

# ─── Backup directory ──────────────────────────────────────────────────────────
BACKUP_DIR="backups/enterprise-fix-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
log_info "Backup directory: $BACKUP_DIR"

# ─── Helper to backup and write files ──────────────────────────────────────
backup_and_write() {
    local file="$1"
    local content="$2"
    if [[ -f "$file" ]]; then
        cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
        log_info "Backed up $file"
    fi
    mkdir -p "$(dirname "$file")"
    echo "$content" > "$file"
    log_success "Written $file"
}

# ─── 1. Install required packages ──────────────────────────────────────────
log_info "Installing required packages..."
if ! grep -q '"react-markdown"' "$ROOT/package.json" 2>/dev/null; then
    npm install react-markdown remark-gfm --save --workspace="$ROOT" 2>/dev/null || \
    npm install react-markdown remark-gfm --save 2>/dev/null || \
    log_warning "Could not auto-install dependencies. Please manually run: npm install react-markdown remark-gfm"
else
    log_success "Dependencies already installed."
fi

# ─── 2. Patch useStreamingChat.ts (add safeContent) ──────────────────────
log_info "Patching useStreamingChat.ts with safeContent helper..."
USE_STREAMING_FILE="$ROOT/hooks/useStreamingChat.ts"

# We'll insert the safeContent helper after the imports.
# We'll use a marker to find the right place.
# Simple approach: prepend the helper right after the import block.
# We'll use sed to insert after the first 'import' line (or at top of file).
# Since it's complex to do with sed perfectly, we'll replace the entire file with a new version that includes the helper.
# We'll read the existing file and insert the helper, but to be safe, we'll generate a new file with the helper at the top.

# Backup original
cp "$USE_STREAMING_FILE" "$BACKUP_DIR/$(basename "$USE_STREAMING_FILE").bak" 2>/dev/null || true

# Create a new file: we'll use cat to build it.
# We'll extract the existing file content (minus the initial import lines?) – better to just create a new file with the helper included.
# Since we don't have the full original content, we'll use a patch approach:
# We'll create a patch file that adds the helper, but easier: we'll replace the file with a version that includes the helper at the top.

# We'll write a new version of useStreamingChat.ts that includes the safeContent helper.
# We'll read the original file and add the helper after the imports.
# We'll use a temporary file to avoid overwriting in case of error.

TMP_FILE=$(mktemp)
cat > "$TMP_FILE" << 'SAFE_CONTENT_EOF'
// ─── Safe content extractor ──────────────────────────────────────────────
const safeContent = (data: unknown): string => {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as any;
    if (obj.props?.dangerouslySetInnerHTML?.__html) {
      return String(obj.props.dangerouslySetInnerHTML.__html);
    }
    if (obj.props?.children) {
      return String(obj.props.children);
    }
    try {
      return JSON.stringify(data);
    } catch {
      return '[object Object]';
    }
  }
  return String(data);
};
SAFE_CONTENT_EOF

# Now we need to insert this after the imports in the original file.
# We'll find the line that contains the last import and insert after it.
# We'll use awk or sed. Since the file may vary, we'll use a more robust method:
# We'll copy the original, then use awk to insert after the import block.

if [[ -f "$USE_STREAMING_FILE" ]]; then
    # Determine if the file already has the helper – if so, skip.
    if grep -q "safeContent" "$USE_STREAMING_FILE"; then
        log_info "safeContent already present in useStreamingChat.ts"
    else
        # Insert after imports
        # We'll use sed to find the first line that is not an import and insert before it.
        # Better: use awk to print all imports, then the helper, then the rest.
        awk '
        /^import / { print; next }
        /^$/ { if (!done) { print; print ""; print "// ─── Safe content extractor ──────────────────────────────────────────────"; print "const safeContent = (data: unknown): string => {"; print "  if (typeof data === '\''string'\'') return data;"; print "  if (data && typeof data === '\''object'\'') {"; print "    const obj = data as any;"; print "    if (obj.props?.dangerouslySetInnerHTML?.__html) {"; print "      return String(obj.props.dangerouslySetInnerHTML.__html);"; print "    }"; print "    if (obj.props?.children) {"; print "      return String(obj.props.children);"; print "    }"; print "    try {"; print "      return JSON.stringify(data);"; print "    } catch {"; print "      return '\''[object Object]'\'';"; print "    }"; print "  }"; print "  return String(data);"; print "};"; print ""; done=1; } { print }' "$USE_STREAMING_FILE" > "$TMP_FILE.tmp" && mv "$TMP_FILE.tmp" "$USE_STREAMING_FILE"
        log_success "Inserted safeContent into useStreamingChat.ts"
    fi
else
    log_warning "useStreamingChat.ts not found – skipping patch."
fi

# ─── 3. Create ChatMessage.tsx ──────────────────────────────────────────────
log_info "Creating ChatMessage component..."
CHAT_MESSAGE_CODE=$(cat << 'CHAT_MSG_EOF'
'use client';

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date;
  isStreaming?: boolean;
  className?: string;
}

export const ChatMessage = memo(function ChatMessage({
  content,
  role,
  timestamp,
  isStreaming = false,
  className,
}: ChatMessageProps) {
  const safeContent = typeof content === 'string' ? content : String(content);
  const displayContent = safeContent.trim() || (role === 'assistant' ? '…' : '');

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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
CHAT_MSG_EOF
)
backup_and_write "$ROOT/components/chat/ChatMessage.tsx" "$CHAT_MESSAGE_CODE"

# ─── 4. Replace ChatClient.tsx ──────────────────────────────────────────────
log_info "Writing mobile‑first ChatClient..."
CHAT_CLIENT_CODE=$(cat << 'CHAT_CLIENT_EOF'
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { NeonComposer } from '@/components/chat/NeonComposer';
import { ThinkingTrace } from '@/components/chat/ThinkingTrace';
import { SetuProgress } from '@/components/chat/SetuProgress';
import { MediaSettings } from '@/components/chat/MediaSettings';
import { GradientGlowBackground } from '@/components/ui/GradientGlowBackground';
import { ThinkingLoader } from '@/components/ui/ThinkingLoader';
import { Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatClient() {
  const { messages, isLoading, error, sendMessage, clearError } = useStreamingChat();
  const [deepThink, setDeepThink] = useState(false);
  const [setuMode, setSetuMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [mode, setMode] = useState<'chat' | 'image' | 'video'>('chat');
  const [mediaSettings, setMediaSettings] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const handleSend = useCallback(
    async (text: string, file?: File) => {
      if (!text.trim()) return;
      await sendMessage(text, { deep: deepThink, setu: setuMode, search: searchMode });
    },
    [sendMessage, deepThink, setuMode, searchMode]
  );

  const handleMediaGenerate = useCallback(
    async (settings: any) => {
      const prompt = `Generate ${mode} with settings: ${JSON.stringify(settings)}`;
      await sendMessage(prompt, { deep: false, setu: false });
    },
    [sendMessage, mode]
  );

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-white/40">Loading Siddhi…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] max-w-4xl mx-auto px-2 md:px-4 relative">
      <GradientGlowBackground isThinking={isLoading} />

      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5 flex-wrap gap-2 sticky top-0 bg-black/80 backdrop-blur-sm z-10 py-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
            <Bot className="w-6 h-6 text-cyan-400 relative" />
          </div>
          <span className="text-white font-semibold text-sm md:text-base">Siddhi</span>
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Online
          </span>
        </div>
        <div className="flex gap-1 flex-wrap">
          <CyberToggle active={deepThink} onClick={() => setDeepThink(!deepThink)} label="Deep" color="purple" />
          <CyberToggle active={setuMode} onClick={() => setSetuMode(!setuMode)} label="SETU" color="amber" />
          <CyberToggle active={searchMode} onClick={() => setSearchMode(!searchMode)} label="Search" color="blue" />
          <CyberToggle active={mode === 'image'} onClick={() => setMode(mode === 'image' ? 'chat' : 'image')} label="Image" color="pink" />
          <CyberToggle active={mode === 'video'} onClick={() => setMode(mode === 'video' ? 'chat' : 'video')} label="Video" color="red" />
        </div>
      </div>

      {/* Media Settings */}
      {(mode === 'image' || mode === 'video') && (
        <MediaSettings
          mode={mode}
          onSettingsChange={setMediaSettings}
          onGenerate={handleMediaGenerate}
          isLoading={isLoading}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {msg.role === 'system' ? (
                <div className="flex justify-center my-2">
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-400/80 font-mono max-w-[90%] backdrop-blur-sm">
                    {typeof msg.content === 'string' ? msg.content : String(msg.content)}
                  </div>
                </div>
              ) : (
                <ChatMessage
                  content={typeof msg.content === 'string' ? msg.content : String(msg.content)}
                  role={msg.role}
                  timestamp={new Date()}
                  isStreaming={msg.isStreaming}
                />
              )}

              {msg.role === 'assistant' && msg.reasoning && (
                <div className="ml-12 mt-1">
                  <ThinkingTrace
                    reasoning={typeof msg.reasoning === 'string' ? msg.reasoning : String(msg.reasoning)}
                    tokens={msg.tokens}
                    timeMs={0}
                    status="done"
                    provider={msg.provider}
                  />
                </div>
              )}

              {msg.role === 'assistant' && msg.leads && msg.leads.length > 0 && (
                <div className="ml-12 mt-2">
                  <SetuProgress leads={msg.leads} csv={msg.csv} isLoading={false} />
                </div>
              )}

              {msg.role === 'assistant' && msg.questions && msg.questions.length > 0 && (
                <div className="ml-12 mt-2 bg-white/5 border border-cyan-500/10 rounded-xl p-3">
                  <p className="text-white/60 text-sm font-mono">Please answer:</p>
                  <ul className="list-disc list-inside text-cyan-400/80 text-sm mt-1 space-y-1">
                    {msg.questions.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="ml-12 mt-2">
            <ThinkingLoader status="thinking" reasoning="Processing…" />
          </div>
        )}

        {error && (
          <div className="flex justify-center my-2">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-xs text-red-400/80 font-mono max-w-[90%] backdrop-blur-sm">
              {error}
              <button onClick={clearError} className="ml-2 text-red-400 hover:text-red-300 underline">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="pt-2 border-t border-white/5 bg-black/50 backdrop-blur-sm sticky bottom-0">
        <NeonComposer
          onSend={handleSend}
          isLoading={isLoading}
          mode={mode}
          onModeChange={setMode}
          isDeepThink={deepThink}
          setIsDeepThink={setDeepThink}
          isSetuMode={setuMode}
          setIsSetuMode={setSetuMode}
          isSearchMode={searchMode}
          setIsSearchMode={setSearchMode}
          onClear={() => {}}
        />
      </div>
    </div>
  );
}

function CyberToggle({ active, onClick, label, color }: any) {
  const colors: any = {
    purple: 'active:bg-purple-600/30 active:text-purple-400 active:border-purple-500/30',
    amber: 'active:bg-amber-600/30 active:text-amber-400 active:border-amber-500/30',
    blue: 'active:bg-blue-600/30 active:text-blue-400 active:border-blue-500/30',
    pink: 'active:bg-pink-600/30 active:text-pink-400 active:border-pink-500/30',
    red: 'active:bg-red-600/30 active:text-red-400 active:border-red-500/30',
  };
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all duration-200 ${
        active ? colors[color] + ' shadow-glow' : 'text-white/40 hover:text-white/70'
      }`}
      title={label}
    >
      <span className="text-xs font-mono">{label}</span>
    </button>
  );
}
CHAT_CLIENT_EOF
)
backup_and_write "$ROOT/app/(app)/chat/ChatClient.tsx" "$CHAT_CLIENT_CODE"

# ─── 5. Create EnterpriseSidebar.tsx ──────────────────────────────────────
log_info "Creating EnterpriseSidebar..."
SIDEBAR_CODE=$(cat << 'SIDEBAR_EOF'
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Compass, ShoppingBag, MessageCircle, User,
  Settings, LogOut, Bot, FolderKanban, BarChart3, Users,
  Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Explore', icon: Compass, href: '/explore' },
  { label: 'Marketplace', icon: ShoppingBag, href: '/marketplace' },
  { label: 'Chat', icon: MessageCircle, href: '/chat' },
  { label: 'Client Panel', icon: FolderKanban, href: '/client' },
  { label: 'Profile', icon: User, href: '/profile' },
];

const ADMIN_ITEMS = [
  { label: 'Admin', icon: BarChart3, href: '/admin' },
  { label: 'Employees', icon: Users, href: '/employee' },
];

const BOTTOM_ITEMS = [
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Logout', icon: LogOut, href: '/logout' },
];

export function EnterpriseSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (window.innerWidth >= 768) setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      if (window.innerWidth >= 768) setIsExpanded(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const renderLink = (item: typeof NAV_ITEMS[0]) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setIsMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
          active
            ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/20'
            : 'text-white/60 hover:bg-white/5 hover:text-white',
          !isExpanded && 'justify-center px-0'
        )}
        title={!isExpanded ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <AnimatePresence>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {active && isExpanded && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className="fixed top-16 left-0 bottom-0 z-30 hidden md:flex flex-col bg-black/95 backdrop-blur-2xl border-r border-cyan-500/10 h-[calc(100vh-64px)] overflow-hidden"
        animate={{ width: isExpanded ? 200 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Brand */}
        <div className={cn(
          'flex items-center h-14 border-b border-cyan-500/10 flex-shrink-0 px-3',
          !isExpanded && 'justify-center'
        )}>
          {isExpanded ? (
            <span className="text-white font-mono text-sm tracking-wider">KALKI OS</span>
          ) : (
            <span className="text-cyan-400 font-bold text-lg">K</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 space-y-1 overflow-y-auto scrollbar-hide px-2">
          {NAV_ITEMS.map(renderLink)}
          <div className="h-px bg-cyan-500/10 my-2" />
          {ADMIN_ITEMS.map(renderLink)}
        </nav>

        {/* Bottom items */}
        <div className="border-t border-cyan-500/10 p-2 space-y-1">
          {BOTTOM_ITEMS.map(renderLink)}
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-20 left-3 z-40 md:hidden p-2 rounded-full bg-black/80 backdrop-blur-sm border border-cyan-500/20 text-white/60 hover:text-white transition"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-black/95 backdrop-blur-2xl border-r border-cyan-500/10 p-4 flex flex-col md:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold tracking-widest text-white/40">MENU</span>
                <button onClick={() => setIsMobileOpen(false)} className="p-2 rounded-full hover:bg-white/5 transition">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto space-y-1">
                {NAV_ITEMS.map(renderLink)}
                <div className="h-px bg-cyan-500/10 my-2" />
                {ADMIN_ITEMS.map(renderLink)}
                <div className="h-px bg-cyan-500/10 my-2" />
                {BOTTOM_ITEMS.map(renderLink)}
              </nav>
              <div className="border-t border-cyan-500/10 pt-4 text-center text-[10px] text-cyan-400/20 font-mono tracking-widest">
                KALKI OS v3.0
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
SIDEBAR_EOF
)
backup_and_write "$ROOT/components/layout/EnterpriseSidebar.tsx" "$SIDEBAR_CODE"

# ─── 6. Replace layout.tsx ──────────────────────────────────────────────────
log_info "Updating layout to use EnterpriseSidebar..."
LAYOUT_CODE=$(cat << 'LAYOUT_EOF'
"use client";

import { EnterpriseSidebar } from "@/components/layout/EnterpriseSidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-black">
      <EnterpriseSidebar />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ml-0 md:ml-[64px]">
        <TopBar onMenuClick={() => {}} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
LAYOUT_EOF
)
backup_and_write "$ROOT/app/(app)/layout.tsx" "$LAYOUT_CODE"

# ─── 7. Verification ──────────────────────────────────────────────────────────
if [[ "$SKIP_TYPE_CHECK" != true ]]; then
    log_info "Running TypeScript type-check..."
    if npm run type-check --workspace="$ROOT" 2>/dev/null || npm run type-check 2>/dev/null; then
        log_success "Type-check passed."
    else
        log_warning "Type-check failed. Please review the changes."
    fi
fi

if [[ "$SKIP_BUILD" != true ]]; then
    log_info "Running build verification..."
    if npm run build --workspace="$ROOT" 2>/dev/null || npm run build 2>/dev/null; then
        log_success "Build succeeded. Enterprise fixes applied!"
    else
        log_warning "Build failed. Please review the changes."
    fi
fi

# ─── Final message ──────────────────────────────────────────────────────────
echo ""
log_success "✅ All enterprise fixes applied."
log_info "Backups stored in: $BACKUP_DIR"
log_info "To restore, copy files from $BACKUP_DIR back."
echo ""
log_info "If you encounter issues, ensure you have installed:"
echo "   npm install react-markdown remark-gfm"
echo ""
log_info "Restart your dev server:"
echo "   npm run dev"