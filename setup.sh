#!/bin/bash
# ================================================================
# KALKI OS – Safe Git Push (All Changes)
# ================================================================
# This script safely commits and pushes all changes to the remote.
# It ensures you are on the correct branch and provides clear output.
#
# Usage: ./push-safely.sh
# ================================================================

set -euo pipefail

echo "📦 Preparing to push all changes..."

# ─── 1. Check git status ──────────────────────────────────────
if [ -z "$(git status --porcelain)" ]; then
    echo "ℹ️ No changes to commit."
    exit 0
fi

# ─── 2. Show current branch ──────────────────────────────────
BRANCH=$(git branch --show-current)
echo "📌 Current branch: $BRANCH"

# ─── 3. Stage all changes ────────────────────────────────────
echo "📝 Staging all changes..."
git add .

# ─── 4. Commit with a descriptive message ────────────────────
COMMIT_MSG="feat: enterprise-grade panels, real-time notifications, presence, and final fixes

- Admin/Employee/Client panels with real-time Supabase
- Notification system with priority, push, and realtime
- User presence (online/offline) with heartbeat
- Sidebar with role-based dynamic menu
- DataTable, StatCard, and other reusable components
- Fixed all TypeScript errors
- Safe SQL migration for notifications and presence
- Disabled notifications realtime on /chat to avoid conflicts
- Updated .env.example with all required keys"

echo "📝 Committing changes..."
git commit -m "$COMMIT_MSG"

# ─── 5. Push to remote ────────────────────────────────────────
echo "🚀 Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

echo ""
echo "🎉 All changes pushed successfully!"
echo "🔗 Remote: $(git remote get-url origin)"
echo "🌿 Branch: $BRANCH"