#!/usr/bin/env bash
# KALKI OS — Production‑grade Git Sync
# Handles: empty repo, no commits, unrelated histories, stash conflicts, push failures.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success(){ echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ------------------------------------------------------------------
# 1. Ensure we're in the project root
# ------------------------------------------------------------------
if [ ! -f "package.json" ] && [ ! -d ".git" ]; then
  log_warn "No package.json or .git found. Are you in the project root?"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# ------------------------------------------------------------------
# 2. Initialize Git if not already
# ------------------------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log_warn "This directory is not a Git repository."
  read -p "Do you want to initialize Git and connect to GitHub? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_error "Aborting."
    exit 1
  fi

  log_info "Initializing Git repository..."
  git init

  if ! git remote get-url origin >/dev/null 2>&1; then
    read -p "Enter your GitHub repository URL: " REMOTE_URL
    if [ -z "$REMOTE_URL" ]; then
      log_error "Remote URL is required."
      exit 1
    fi
    git remote add origin "$REMOTE_URL"
    log_success "Remote 'origin' added: $REMOTE_URL"
  fi
else
  log_info "Git repository already initialized."
fi

# ------------------------------------------------------------------
# 3. Determine current branch (handle detached HEAD)
# ------------------------------------------------------------------
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ -z "$CURRENT_BRANCH" ]; then
  log_warn "You are on a detached HEAD. Creating branch 'main'."
  git checkout -b main
  CURRENT_BRANCH="main"
fi
log_info "Current branch: $CURRENT_BRANCH"

# ------------------------------------------------------------------
# 4. Check if the repository has any commits yet
# ------------------------------------------------------------------
if ! git rev-parse HEAD >/dev/null 2>&1; then
  log_warn "Repository has no commits yet. Creating an empty initial commit..."
  git commit --allow-empty -m "Initial empty commit" || {
    # If nothing to commit, add a dummy file and commit
    echo "# KALKI OS" > README.md
    git add README.md
    git commit -m "Initial commit"
  }
  log_success "Initial commit created."
fi

# ------------------------------------------------------------------
# 5. Stash uncommitted changes (safely)
# ------------------------------------------------------------------
STASH_REF=""
if ! git diff --quiet || ! git diff --cached --quiet; then
  log_warn "You have uncommitted changes. Stashing them..."
  STASH_REF=$(git stash push -u -m "Auto-stash before sync $(date +%Y%m%d-%H%M%S)" | grep -o 'stash@{[0-9]*}' | head -1 || echo "")
  if [ -n "$STASH_REF" ]; then
    log_info "Stashed as: $STASH_REF"
  else
    log_warn "Stash may have failed or nothing to stash."
  fi
fi

# ------------------------------------------------------------------
# 6. Fetch latest from remote (with fallback if remote is empty)
# ------------------------------------------------------------------
log_info "Fetching latest from origin..."
if ! git fetch origin 2>/dev/null; then
  log_warn "Fetch failed. The remote may be empty or unreachable. Continuing..."
fi

# ------------------------------------------------------------------
# 7. Create a backup branch (safety)
# ------------------------------------------------------------------
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)-$CURRENT_BRANCH"
log_info "Creating backup branch: $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH" 2>/dev/null || log_warn "Backup branch may already exist."

# ------------------------------------------------------------------
# 8. Check if remote branch exists
# ------------------------------------------------------------------
REMOTE_EXISTS=false
if git ls-remote --heads origin "$CURRENT_BRANCH" 2>/dev/null | grep -q "$CURRENT_BRANCH"; then
  REMOTE_EXISTS=true
  log_info "Remote branch $CURRENT_BRANCH exists."
else
  log_info "Remote branch $CURRENT_BRANCH does not exist (or remote is empty)."
fi

# ------------------------------------------------------------------
# 9. Merge or rebase remote changes
# ------------------------------------------------------------------
if [ "$REMOTE_EXISTS" = true ]; then
  log_info "Merging remote changes into local branch..."
  
  # Try merge with --allow-unrelated-histories if needed
  if git merge "origin/$CURRENT_BRANCH" --no-edit 2>/dev/null; then
    log_success "Merge successful."
  else
    # If merge fails, try with --allow-unrelated-histories (common for first sync)[reference:2]
    log_warn "Normal merge failed. Trying with --allow-unrelated-histories..."
    if git merge "origin/$CURRENT_BRANCH" --allow-unrelated-histories --no-edit 2>/dev/null; then
      log_success "Merge with --allow-unrelated-histories successful."
    else
      log_error "Merge conflicts detected!"
      log_info "Please resolve conflicts manually, then commit and run:"
      log_info "  git add . && git commit -m 'Resolve merge conflicts'"
      log_info "  git push origin $CURRENT_BRANCH"
      log_info "After resolving, delete the backup branch: git branch -d $BACKUP_BRANCH"
      exit 1
    fi
  fi
else
  log_info "No remote branch to merge. Skipping merge."
fi

# ------------------------------------------------------------------
# 10. Restore stash (if any) — with conflict handling
# ------------------------------------------------------------------
if [ -n "$STASH_REF" ]; then
  log_info "Restoring stashed changes..."
  if git stash pop 2>/dev/null; then
    log_success "Stash restored successfully."
  else
    log_warn "Stash pop failed (conflicts?). Keeping stash for manual recovery."
    log_info "Your changes are still in the stash. To apply them manually:"
    log_info "  git stash list"
    log_info "  git stash apply <stash-ref>"
    log_info "  git stash drop <stash-ref>  # after confirmation"
  fi
fi

# ------------------------------------------------------------------
# 11. Add and commit any remaining changes
# ------------------------------------------------------------------
if git status --porcelain | grep -q .; then
  log_info "There are uncommitted changes. Adding and committing them..."
  git add -A
  git commit -m "WIP: Auto-commit before push $(date +%Y%m%d-%H%M%S)" || log_warn "Nothing to commit."
fi

# ------------------------------------------------------------------
# 12. Push to remote
# ------------------------------------------------------------------
log_info "Pushing local branch to origin..."
if git push -u origin "$CURRENT_BRANCH" 2>/dev/null; then
  log_success "Push successful!"
else
  log_warn "Push failed. Trying with --force-with-lease..."
  if git push -u origin "$CURRENT_BRANCH" --force-with-lease 2>/dev/null; then
    log_success "Push with --force-with-lease successful!"
  else
    log_error "Push failed. Manual intervention required."
    log_info "Try: git push -u origin $CURRENT_BRANCH --force"
    log_info "Backup branch available: $BACKUP_BRANCH"
    exit 1
  fi
fi

# ------------------------------------------------------------------
# 13. Final success
# ------------------------------------------------------------------
log_success "═══════════════════════════════════════════════════════════════"
log_success "✅ Git sync completed successfully!"
log_success ""
log_success "Branch: $CURRENT_BRANCH is now in sync with remote."
log_success "Backup branch: $BACKUP_BRANCH (delete later: git branch -d $BACKUP_BRANCH)"
log_success ""
log_success "🚀 To check status: git status"
log_success "═══════════════════════════════════════════════════════════════"