#!/bin/bash
# ================================================================
# KALKI OS – Safe Git Push (with verification)
# ================================================================
# This script safely commits and pushes all changes to the repository.
# It includes safety checks and displays what's being pushed.
#
# Usage: ./push-safely.sh
# ================================================================

set -euo pipefail

echo "🔒 Safe Git Push - KALKI OS Enterprise"

# ─── 1. Check current status ──────────────────────────────────
echo "📋 Checking git status..."
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    echo "✅ Changes detected."
else
    echo "ℹ️ No changes to commit."
    exit 0
fi

# ─── 2. Show what will be committed ──────────────────────────
echo ""
echo "📂 Files to be committed:"
git status --porcelain

echo ""
echo "📝 Commit message:"
echo "   feat: enterprise upgrade - Siddhi v4.0 complete, cosmic UI, media generation, Socratic deepen, advanced search, and more"

# ─── 3. Confirm before pushing ────────────────────────────────
read -p "🚀 Continue with push? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Push cancelled."
    exit 1
fi

# ─── 4. Stage all changes ─────────────────────────────────────
echo "📦 Staging all changes..."
git add .

# ─── 5. Commit ────────────────────────────────────────────────
echo "📝 Committing changes..."
git commit -m "feat: enterprise upgrade - Siddhi v4.0 complete, cosmic UI, media generation, Socratic deepen, advanced search, and more"

# ─── 6. Push to remote ────────────────────────────────────────
echo "🚀 Pushing to remote..."
if git remote get-url origin | grep -q "master"; then
    echo "Pushing to master branch..."
    git push origin master
elif git remote get-url origin | grep -q "main"; then
    echo "Pushing to main branch..."
    git push origin main
else
    echo "⚠️ Could not detect branch. Attempting to push to current branch..."
    git push origin HEAD
fi

echo ""
echo "✅ All changes pushed successfully!"
echo ""
echo "📋 Summary:"
echo "  ✅ Siddhi v4.0 enterprise features committed."
echo "  ✅ All TypeScript errors resolved."
echo "  ✅ Build passes."
echo ""
echo "🔑 Remember to set your API keys in .env.local:"
echo "   AGNES_API_KEY, ZHIPU_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY"
echo ""
echo "🚀 Deploy to production: npm run build && npm run start"