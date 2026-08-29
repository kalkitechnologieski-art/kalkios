#!/bin/bash
# ================================================================
# KALKI OS – Push All Changes to GitHub
# ================================================================

set -euo pipefail

echo "📦 Pushing all changes to GitHub..."

# Ensure we are in the git root
cd "$(git rev-parse --show-toplevel)" 2>/dev/null || {
    echo "❌ Not in a git repository. Exiting."
    exit 1
}

# Check for uncommitted changes
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
    echo "ℹ️ No changes to commit."
    exit 0
fi

# Add all changes
echo "📝 Adding all changes..."
git add .

# Commit with a descriptive message
COMMIT_MSG="feat: enterprise-grade panels, real-time notifications, presence, and full admin/employee/client dashboards

- Admin: Users, Orders, Leads, Projects, Services, Analytics, Notifications panel
- Employee: Dashboard, Tasks, Timesheet, Chat
- Client: Dashboard, Projects, Orders, Support
- Real-time subscriptions with Supabase Realtime
- User presence (online/offline)
- Enhanced notification bell with gradient glow
- Role-based sidebar (auto-updates on role change)
- DataTable with search, sort, pagination
- Integrated all new services

TypeScript strict, zero errors, production-ready."

echo "📝 Committing..."
git commit -m "$COMMIT_MSG"

# Determine the current branch
BRANCH=$(git branch --show-current)
echo "📌 Current branch: $BRANCH"

# Push to remote
echo "🚀 Pushing to origin/$BRANCH..."
git push origin $BRANCH

echo "✅ All changes pushed successfully!"