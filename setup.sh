#!/usr/bin/env bash
set -e

BRANCH=$(git branch --show-current)
echo "📌 Current branch: $BRANCH"

echo "📦 Adding all changes..."
git add .

echo "✏️ Committing changes..."
git commit -m "feat: enterprise chat, homepage, and hydration fixes" || echo "No changes to commit."

echo "⬇️ Pulling latest from origin/$BRANCH..."
git pull origin "$BRANCH" --rebase || echo "Pull failed, continuing..."

echo "⬆️ Pushing to origin/$BRANCH..."
git push origin "$BRANCH"

echo "✅ Push completed successfully."