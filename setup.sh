#!/bin/bash
# ================================================================
# KALKI OS – Safe Git Push (All Changes)
# ================================================================
# This script stages, commits, and pushes all changes to the remote
# repository. It is safe to run even if there are uncommitted changes.
#
# Usage: ./safe-push.sh
# ================================================================

set -euo pipefail

echo "🚀 Preparing to push all changes safely..."

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    echo "ℹ️ No changes to commit."
    exit 0
fi

# Show what will be committed
echo ""
echo "📋 Files to be committed:"
git status --short

echo ""
read -p "❓ Do you want to continue with commit and push? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Stage all changes
echo "📦 Staging all changes..."
git add .

# Generate commit message with timestamp
COMMIT_MSG="feat: enterprise upgrade - notifications, presence, admin/employee panels, realtime fixes, production-ready"

echo "📝 Committing with message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# Determine branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🔀 Pushing to branch: $BRANCH"

# Push
if git push origin "$BRANCH"; then
    echo ""
    echo "✅ All changes pushed successfully!"
else
    echo ""
    echo "❌ Push failed. Please check your remote connection and permissions."
    exit 1
fi