#!/usr/bin/env bash
set -euo pipefail

# ─── Colours ────────────────────────────────────────────────────────────────
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

# ─── Detect root ──────────────────────────────────────────────────────────
if [[ -d "apps/web" && -d "apps/web/lib" ]]; then
    ROOT="apps/web"
elif [[ -d "lib" ]]; then
    ROOT="."
else
    die "Could not detect project structure."
fi

BACKUP_DIR="backups/enterprise-sidebar-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
log_info "Backup directory: $BACKUP_DIR"

# ─── Rewrite EnterpriseSidebar ──────────────────────────────────────────
log_info "Writing enterprise-grade EnterpriseSidebar..."

SIDEBAR_FILE="$ROOT/components/layout/EnterpriseSidebar.tsx"
mkdir -p "$(dirname "$SIDEBAR_FILE")"

if [[ -f "$SIDEBAR_FILE" ]]; then
    cp "$SIDEBAR_FILE" "$BACKUP_DIR/EnterpriseSidebar.bak"
    log_info "Backed up existing file."
fi

cat > "$SIDEBAR_FILE" << 'SIDEBAR_EOF'
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Compass,
  ShoppingBag,
  MessageCircle,
  User,
  Settings,
  LogOut,
  FolderKanban,
  BarChart3,
  Users,
  Menu,
  X,
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

interface EnterpriseSidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function EnterpriseSidebar({ isMobileOpen, setMobileOpen }: EnterpriseSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
          active
            ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/20'
            : 'text-white/60 hover:bg-white/5 hover:text-white',
          !isExpanded && 'justify-center px-0'
        )}
        title={!isExpanded ? item.label : undefined}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <AnimatePresence mode="wait">
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
      {/* ─── Desktop Sidebar ─── */}
      <motion.aside
        className="fixed top-14 left-0 bottom-0 z-30 hidden md:flex flex-col bg-black/95 backdrop-blur-2xl border-r border-cyan-500/10 overflow-hidden"
        animate={{ width: isExpanded ? 200 : 64 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex items-center h-14 border-b border-cyan-500/10 flex-shrink-0 px-3',
            !isExpanded && 'justify-center'
          )}
        >
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

      {/* ─── Mobile Trigger ─── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-20 left-3 z-40 md:hidden p-2 rounded-full bg-black/80 backdrop-blur-sm border border-cyan-500/20 text-white/60 hover:text-white transition"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ─── Mobile Drawer ─── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
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
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-full hover:bg-white/5 transition"
                  aria-label="Close menu"
                >
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

log_success "EnterpriseSidebar rewritten."

# ─── Build verification ──────────────────────────────────────────────────
log_info "Running type-check and build..."
if npm run type-check --workspace="$ROOT" 2>/dev/null || npm run type-check 2>/dev/null; then
    log_success "Type-check passed."
else
    log_warning "Type-check had issues – attempting build anyway."
fi

if npm run build --workspace="$ROOT" 2>&1; then
    log_success "✅ Build succeeded."
else
    log_error "❌ Build failed. Please check errors."
    exit 1
fi

# ─── Final message ──────────────────────────────────────────────────────────
echo ""
log_success "╔═══════════════════════════════════════════════════════════════╗"
log_success "║   🚀 ENTERPRISE SIDEBAR – DEPLOYED SUCCESSFULLY           ║"
log_success "╚═══════════════════════════════════════════════════════════════╝"
log_info "Backups stored in: $BACKUP_DIR"
echo ""
log_info "✅ Clean imports – no duplicate Menu imports."
log_info "✅ Hover‑expand on desktop (shows labels)."
log_info "✅ Collapsed state shows only icons (64px)."
log_info "✅ Mobile drawer full‑screen slide‑in."
log_info "✅ Active states with cyan highlighting."
log_info "✅ Glassmorphism + cyberpunk styling."
log_info "✅ Smooth animations with Framer Motion."
echo ""
log_info "🚀 Restart dev server: npm run dev"