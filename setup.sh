#!/usr/bin/env bash
set -Eeuo pipefail

echo "🚀 Pushing KALKI OS changes to repository..."
echo "============================================"

# ------------------------------------------------------------------
# 1. Check git
# ------------------------------------------------------------------
if ! command -v git &> /dev/null; then
  echo "❌ Git is not installed."
  exit 1
fi

# ------------------------------------------------------------------
# 2. Check if we're in a git repo
# ------------------------------------------------------------------
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "❌ Not inside a Git repository."
  exit 1
fi

# ------------------------------------------------------------------
# 3. Stage all changes
# ------------------------------------------------------------------
echo "📦 Staging all changes..."
git add -A

# ------------------------------------------------------------------
# 4. Check if there are changes to commit
# ------------------------------------------------------------------
if git diff --staged --quiet; then
  echo "📭 No changes to commit."
  exit 0
fi

# ------------------------------------------------------------------
# 5. Commit with a detailed message
# ------------------------------------------------------------------
COMMIT_MSG=$(cat <<EOF
🧠 KALKI OS – Enterprise-Grade Media & DeepThink Fix

- Fixed provider imports: use AgnesClient, GroqClient, ZhipuClient classes
- Image generation now emits real-time progress events (10% → 100%)
- Intent priority: image > video > setu > deep_think
- DeepThink indicator always visible in chat top bar
- Chat history persists via IndexedDB (on-device storage)
- Knowledge base (Siddhi identity) loaded from public/knowledge.json
- Fixed Groq model: llama-3.3-70b-versatile → llama-3.1-70b-versatile
- All TypeScript errors resolved, build passes

Ready for production deployment.
EOF
)

echo "📝 Committing changes..."
git commit -m "$COMMIT_MSG"

# ------------------------------------------------------------------
# 6. Push to remote
# ------------------------------------------------------------------
echo "📤 Pushing to remote..."
if git push 2>&1; then
  echo "✅ Push successful!"
else
  echo "⚠️ Push failed. You may need to set upstream branch."
  echo "   Try: git push --set-upstream origin $(git branch --show-current)"
  exit 1
fi

# ------------------------------------------------------------------
# 7. Summary
# ------------------------------------------------------------------
echo ""
echo "✅ All changes pushed successfully!"
echo "📊 Current branch: $(git branch --show-current)"
echo "🔗 Remote URL: $(git remote get-url origin)"
echo "🚀 KALKI OS is now up-to-date in the repository."