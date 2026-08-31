#!/usr/bin/env bash
# =============================================================================
# KALKI OS – Git Push to Origin (Simple, Safe, Enterprise Grade)
# =============================================================================
# This script adds all changes, commits with a timestamped message,
# and pushes to the current branch's origin.
#
# Usage:
#   ./push-to-origin.sh [commit-message]
#
# If no commit message is provided, it generates one automatically.
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
log_error()   { echo -e "${RED}${BOLD}[ERROR]${NC} $*" >&2; }
die()         { log_error "$*"; exit 1; }

# ─── Help ──────────────────────────────────────────────────────────────────────
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    cat << EOF
Usage: $0 [commit-message]

If no commit message is provided, a default timestamped message is used.
EOF
    exit 0
fi

# ─── Check if we are in a git repository ──────────────────────────────────────
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    die "Not inside a Git repository."
fi

# ─── Get current branch ──────────────────────────────────────────────────────
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log_info "Current branch: $CURRENT_BRANCH"

# ─── Check if there are changes to commit ────────────────────────────────────
if git diff --quiet && git diff --cached --quiet && git ls-files --others --exclude-standard --quiet; then
    log_info "No changes to commit. Exiting."
    exit 0
fi

# ─── Determine commit message ────────────────────────────────────────────────
if [[ $# -gt 0 ]]; then
    COMMIT_MSG="$1"
else
    COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# ─── Stage all changes ──────────────────────────────────────────────────────
log_info "Staging all changes..."
git add .
log_success "Staged."

# ─── Commit ──────────────────────────────────────────────────────────────────
log_info "Committing with message: '$COMMIT_MSG'"
git commit -m "$COMMIT_MSG"
log_success "Committed."

# ─── Push to origin ──────────────────────────────────────────────────────────
log_info "Pushing to origin/$CURRENT_BRANCH ..."
if git push origin "$CURRENT_BRANCH"; then
    log_success "Push successful."
else
    die "Push failed. Please check your network and permissions."
fi

# ─── Done ──────────────────────────────────────────────────────────────────────
log_success "✅ All changes have been pushed to origin/$CURRENT_BRANCH"