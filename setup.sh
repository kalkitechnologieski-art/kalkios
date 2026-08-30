#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# SIDDHI AI – FINAL PUSH TO ORIGIN
# ============================================================================
# This script commits all changes and pushes them to the remote repository.
# It also runs a final build check to ensure everything is working.
# ============================================================================

ROOT_DIR="$(pwd)"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
LOG_FILE="${ROOT_DIR}/push_to_origin_${TIMESTAMP}.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting final push to origin..."

# -----------------------------------------------------------------------------
# 1. Check if we are in a git repository
# -----------------------------------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "ERROR: Not inside a git repository."
  exit 1
fi

# -----------------------------------------------------------------------------
# 2. Ensure we are on the master branch (or main)
# -----------------------------------------------------------------------------
BRANCH=$(git branch --show-current)
log "Current branch: $BRANCH"

if [[ "$BRANCH" != "master" && "$BRANCH" != "main" ]]; then
  log "WARNING: You are on branch '$BRANCH'. Pushing to origin/$BRANCH."
fi

# -----------------------------------------------------------------------------
# 3. Check for uncommitted changes
# -----------------------------------------------------------------------------
if git diff --quiet && git diff --cached --quiet; then
  log "No changes to commit."
else
  log "Changes detected. Staging and committing..."
  git add .
  git commit -m "Siddhi AI: enterprise-grade fixes with streaming, reasoning, SETU, image/video generation"
  log "Commit successful."
fi

# -----------------------------------------------------------------------------
# 4. Pull latest changes (to avoid merge conflicts)
# -----------------------------------------------------------------------------
log "Pulling latest changes from origin/$BRANCH..."
git pull origin "$BRANCH" --rebase || {
  log "WARNING: Rebase failed. Trying to merge..."
  git pull origin "$BRANCH"
}

# -----------------------------------------------------------------------------
# 5. Run final build check (to ensure everything works)
# -----------------------------------------------------------------------------
log "Running final build check..."
cd "${ROOT_DIR}/apps/web"
if npm run build; then
  log "Build passed. Proceeding with push."
else
  log "ERROR: Build failed. Please fix errors before pushing."
  exit 1
fi

# -----------------------------------------------------------------------------
# 6. Push to origin
# -----------------------------------------------------------------------------
log "Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

log "============================================================="
log "Push completed successfully."
log "Log file: $LOG_FILE"
log "============================================================="

exit 0