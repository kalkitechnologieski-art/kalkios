#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# PUSH TO ORIGIN – KALKI OS
# ============================================================================
# This script commits all changes and pushes to the remote origin.
# It includes a pre-push build check to ensure the code is valid.
# ============================================================================

ROOT_DIR="$(pwd)"
APP_DIR="${ROOT_DIR}/apps/web"
BRANCH="master"  # Change if you use a different branch

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "Starting push to origin..."

# -----------------------------------------------------------------------------
# 1. Check if we are on the correct branch
# -----------------------------------------------------------------------------
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  log "WARNING: You are on branch '$CURRENT_BRANCH', not '$BRANCH'."
  read -p "Continue pushing to $CURRENT_BRANCH? (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
  BRANCH=$CURRENT_BRANCH
fi

# -----------------------------------------------------------------------------
# 2. Check git status
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
COMMIT_MSG="feat: Enterprise Siddhi AI implementation

- Added provider clients (Agnes, Groq, OpenRouter, Zhipu)
- Implemented IntelligentRouter with circuit-breaker, rate-limiter, retry
- Added Chain-of-Thought reasoning with web grounding
- Created SETU agent for lead generation with CSV export
- Implemented SiddhiAgent for self-aware intent detection
- Added streaming API route with SSE
- Integrated image and video generation
- Added error boundaries and audit logging
- Fixed all TypeScript errors (strict mode)
- Enterprise-grade error handling and fallbacks"

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
log "============================================================="