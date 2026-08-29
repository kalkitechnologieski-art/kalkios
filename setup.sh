#!/bin/bash
# ================================================================
# KALKI OS – Git Push All Changes
# ================================================================
# This script stages, commits, and pushes all changes to the remote repository.
# It handles both master and main branches.
#
# Usage: ./git-push-all.sh
# ================================================================

set -euo pipefail

echo "📦 Checking git status..."
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    echo "✅ Changes detected."
else
    echo "ℹ️ No changes to commit."
    exit 0
fi

echo "📦 Staging all changes..."
git add .

echo "📝 Committing changes..."
git commit -m "feat: enterprise upgrade - Siddhi v3, cosmic UI, media generation, glitch cards, and more"

echo "🚀 Pushing to remote..."
if git remote get-url origin | grep -q "master"; then
    git push origin master
elif git remote get-url origin | grep -q "main"; then
    git push origin main
else
    echo "⚠️ Could not detect branch. Attempting to push to current branch..."
    git push origin HEAD
fi

echo "✅ All changes pushed successfully!"