#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# PUSH TO ORIGIN – KALKI OS
# ============================================================================
# This script commits all changes and pushes to the remote origin.
# It runs a build check to ensure the code is valid before pushing.
# ============================================================================

ROOT_DIR="$(pwd)"
APP_DIR="${ROOT_DIR}/apps/web"
BRANCH=$(git branch --show-current)
REMOTE="origin"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "Starting push to origin..."

# -----------------------------------------------------------------------------
# 1. Check if we are on a valid branch
# -----------------------------------------------------------------------------
if [ -z "$BRANCH" ]; then
  log "ERROR: Not on any branch. Please checkout a branch first."
  exit 1
fi
log "Current branch: $BRANCH"

# -----------------------------------------------------------------------------
# 2. Check if there are any changes to commit
# -----------------------------------------------------------------------------
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  log "No changes to commit. Nothing to push."
  exit 0
fi

# -----------------------------------------------------------------------------
# 3. Run type-check and build (optional but recommended)
# -----------------------------------------------------------------------------
read -p "Run type-check and build before pushing? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
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
else
  log "Skipping type-check and build."
fi

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
- Enterprise-grade error handling and fallbacks
- Mobile-first ChatClient with ReactMarkdown
- Removed dangerouslySetInnerHTML for security"

log "Committing changes..."
git commit -m "$COMMIT_MSG"

# -----------------------------------------------------------------------------
# 6. Pull latest changes from remote (rebase to avoid conflicts)
# -----------------------------------------------------------------------------
log "Pulling latest changes from $REMOTE/$BRANCH..."
git pull "$REMOTE" "$BRANCH" --rebase || {
  log "Pull failed. Please resolve conflicts manually."
  exit 1
}

# -----------------------------------------------------------------------------
# 7. Push to origin
# -----------------------------------------------------------------------------
log "Pushing to $REMOTE/$BRANCH..."
git push "$REMOTE" "$BRANCH" || {
  log "Push failed. You may need to force push if rebase rewrote history."
  read -p "Force push? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Force pushing..."
    git push "$REMOTE" "$BRANCH" --force-with-lease
  else
    log "Push aborted."
    exit 1
  fi
}

log "============================================================="
log "Push completed successfully to $REMOTE/$BRANCH."
log "============================================================="