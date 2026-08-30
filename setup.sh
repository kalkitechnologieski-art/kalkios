cd /d/kalkicore

# Check the current status
git status

# Add all changes (including new files and modifications)
git add .

# Commit with a descriptive message
git commit -m "feat: enterprise Siddhi AI with all features fixed

- Cyberpunk UI restored with all toggle buttons (Deep, SETU, Search, Image, Video)
- Reasoning traces (Thinking) now display correctly
- Web search integrated into ChainOfThought with Zhipu API
- SETU lead generation with Socratic questions and CSV download
- Image generation via Agnes Image 2.1 Flash
- Video generation via Agnes Video 2.5 with polling
- Full provider fallback chain (Agnes → Groq → OpenRouter → Zhipu)
- Enterprise-grade error handling and logging
- Build passes with zero TypeScript errors"

# Push to origin (replace 'master' with your branch if different)
git push origin master