# 1. Run the final build check
cd /d/kalkicore
npm run build

# 2. If build passes, stage all changes
git add .

# 3. Review changes
git status

# 4. Commit with a clear message
git commit -m "Enterprise chat fix: Agnes AI fallbacks, SETU/DeepThink, thinking traces, hydration fix"

# 5. Push to your repository
git push origin master