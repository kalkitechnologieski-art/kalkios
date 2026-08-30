#!/usr/bin/env bash
set -euo pipefail

cd /d/kalkicore

# Add all changes
git add .

# Commit with a descriptive message
git commit -m "Production fix: streaming SSE, empty response handling, provider client fixes"

# Push to the remote master branch
git push origin master

echo "✅ Changes pushed successfully."
echo "🚀 Deploy to Vercel: vercel --prod"