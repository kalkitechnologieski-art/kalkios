#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# SIDDHI AI – COMMIT AND PUSH
# ============================================================================
# This script commits all changes and pushes to origin/master.
# ============================================================================

echo "Checking for changes..."
if git diff --quiet && git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

echo "Staging all changes..."
git add .

echo "Committing changes..."
git commit -m "feat: Enterprise Siddhi AI upgrade – self-healing agent with streaming, SETU, and multimodal"

echo "Pushing to origin/master..."
git push origin master

echo "Done."