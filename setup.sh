#!/bin/bash
set -euo pipefail

echo "📦 Adding all changes..."
git add .

echo "📝 Committing..."
git commit -m "feat: complete Batch 1-3 enhancements – production-ready

- Added industry-grade error handling, immutable ledger, Google OAuth sync
- Implemented atomic billing for calls and AI chat
- Enhanced frontend UX with responsive design, real-time chat, quick actions
- Fixed CSS and build issues; all tests pass"

echo "🚀 Pushing to remote..."
git push

echo "✅ Push complete!"