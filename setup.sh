#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# PUSH TO ORIGIN – SIDDHI AI ENTERPRISE
# ============================================================================
# This script commits all changes and pushes to the remote origin.
# It includes a pre-push build check to ensure the code is valid.
# ============================================================================

ROOT_DIR="$(pwd)"
APP_DIR="${ROOT_DIR}/apps/web"
BRANCH=$(git branch --show-current || echo "master")
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
LOG_FILE="${ROOT_DIR}/push_${TIMESTAMP}.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting push to origin..."

# -----------------------------------------------------------------------------
# 1. Check if we are in a git repository
# -----------------------------------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "ERROR: Not in a git repository."
  exit 1
fi

# -----------------------------------------------------------------------------
# 2. Check if there are changes to commit
# -----------------------------------------------------------------------------
if git diff --quiet && git diff --cached --quiet; then
  log "No changes to commit. Nothing to push."
  exit 0
fi

# -----------------------------------------------------------------------------
# 3. Build and type-check (ensure code is valid)
# -----------------------------------------------------------------------------
log "Running type-check..."
cd "$APP_DIR"
if npm run type-check; then
  log "Type-check passed."
else
  log "Type-check failed. Please fix errors before pushing."
  exit 1
fi

log "Running build..."
if npm run build; then
  log "Build passed."
else
  log "Build failed. Please fix errors before pushing."
  exit 1
fi

cd "$ROOT_DIR"

# -----------------------------------------------------------------------------
# 4. Add all changes
# -----------------------------------------------------------------------------
log "Adding all changes..."
git add .

# -----------------------------------------------------------------------------
# 5. Commit with a meaningful message
# -----------------------------------------------------------------------------
COMMIT_MSG="feat: Enterprise Siddhi AI – mobile-first, always active

- Complete mobile-first responsive design for all chat components
- Always active with health checks and auto-reconnect
- Integrated all AI providers (Agnes, Zhipu, Groq, OpenRouter)
- Added MediaProgress with neon gradient progress bar
- Full support for DeepThink, SETU, Search, Image, Video
- Collapsible media settings with full controls
- Removed Redis dependency – in-memory caching fallback
- Enterprise-grade error handling and audit logging
- Fixed all TypeScript errors, strict mode enabled
- Build passes with zero errors"

log "Committing changes..."
git commit -m "$COMMIT_MSG"

# -----------------------------------------------------------------------------
# 6. Push to origin
# -----------------------------------------------------------------------------
log "Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

log "============================================================="
log "Push completed successfully."
log "Branch: $BRANCH"
log "Commit: $(git rev-parse --short HEAD)"
log "============================================================="

exit 0