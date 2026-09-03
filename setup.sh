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

BACKUP_DIR="backups/final-ts-fix-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
log_info "Backup directory: $BACKUP_DIR"

# ─── 1. Fix tailwind.config.ts - remove plugin reference ──────────────
log_info "Fixing tailwind.config.ts..."

TAILWIND_CONFIG="$ROOT/tailwind.config.ts"
if [[ -f "$TAILWIND_CONFIG" ]]; then
    cp "$TAILWIND_CONFIG" "$BACKUP_DIR/tailwind.config.ts.bak"
    
    # Write a clean config without any plugin references
    cat > "$TAILWIND_CONFIG" << 'TW_EOF'
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '360px',
        'sm': '481px',
        'md': '769px',
        'lg': '1025px',
        'xl': '1201px',
        '2xl': '1440px',
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        cyan: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        purple: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(-8px)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateX(-16px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "zoom-in": {
          from: { transform: "scale(0.8)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,255,255,0.05)" },
          "50%": { boxShadow: "0 0 50px rgba(0,255,255,0.15)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "slide-in-from-bottom-2": {
          from: { transform: "translateY(2rem)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out both",
        "fade-out": "fade-out 0.3s ease-out both",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out both",
        "slide-in": "slide-in 0.3s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
        "zoom-in": "zoom-in 0.3s ease-out both",
        "shimmer": "shimmer 3s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "slide-in-from-bottom-2": "slide-in-from-bottom-2 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
TW_EOF
    log_success "tailwind.config.ts fixed - removed plugins."
else
    log_error "tailwind.config.ts not found."
    exit 1
fi

# ─── 2. Ensure animations are in globals.css ──────────────────────────
CSS_FILE="$ROOT/styles/globals.css"
if [[ ! -f "$CSS_FILE" ]]; then
    CSS_FILE="$ROOT/app/globals.css"
fi

if [[ -f "$CSS_FILE" ]]; then
    if ! grep -q "\\.slide-in-from-bottom {" "$CSS_FILE"; then
        cat >> "$CSS_FILE" << 'CSS_EOF'

/* ─── Animation classes ─── */
@keyframes slide-in-from-bottom {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fade-out {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}
@keyframes slide-in {
  from { transform: translateX(-16px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
@keyframes zoom-in {
  from { transform: scale(0.8); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
@keyframes slide-in-from-bottom-2 {
  from { transform: translateY(2rem); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.slide-in-from-bottom { animation: slide-in-from-bottom 0.3s ease-out both; }
.fade-in { animation: fade-in 0.5s ease-out both; }
.fade-out { animation: fade-out 0.3s ease-out both; }
.slide-in { animation: slide-in 0.3s ease-out both; }
.scale-in { animation: scale-in 0.3s ease-out both; }
.zoom-in { animation: zoom-in 0.3s ease-out both; }
.slide-in-from-bottom-2 { animation: slide-in-from-bottom-2 0.3s ease-out both; }
CSS_EOF
        log_success "Added animation CSS."
    else
        log_info "Animation CSS already present."
    fi
fi

# ─── 3. Build verification ──────────────────────────────────────────────
log_info "Running build to verify fix..."
if npm run build --workspace="$ROOT" 2>&1; then
    log_success "✅ Build succeeded!"
else
    log_error "❌ Build still failed. Please check errors."
    exit 1
fi

# ─── Final message ──────────────────────────────────────────────────────────
echo ""
log_success "╔═══════════════════════════════════════════════════════════════╗"
log_success "║   🚀 FINAL TS FIX – BUILD SUCCESS                         ║"
log_success "╚═══════════════════════════════════════════════════════════════╝"
log_info "Backups stored in: $BACKUP_DIR"
log_info ""
log_info "✅ tailwind.config.ts fixed - removed plugins array."
log_info "✅ Animation classes defined directly in globals.css."
log_info "✅ Build passed."
log_info ""
log_info "🚀 Deploy now: vercel --prod"