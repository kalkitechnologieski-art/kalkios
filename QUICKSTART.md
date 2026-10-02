# Quick Start — SIDDHI v4.0

## 5-Minute Setup

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone and configure
git clone <your-repo>
cd kalkicore
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 2. Start all services
docker-compose up -d

# 3. Access the app
open http://localhost:3000
```

That's it! All services are running:
- ✅ Web app at http://localhost:3000
- ✅ Search engine at http://localhost:8080
- ✅ Redis cache at localhost:6379
- ✅ PostgreSQL at localhost:5432

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start required services (Docker)
docker run -d --name searxng -p 8080:8080 searxng/searxng:latest
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 3. Run dev server
npm run dev

# 4. Open browser
open http://localhost:3000
```

## Try Lead Generation

1. Go to `/chat`
2. Click **Leads** button (green spreadsheet icon)
3. Type: `"Find yoga studios in Bangalore"`
4. Wait for results (~30 seconds)
5. Click **Download CSV**

## Key Features

### 🤖 Siddhi AI Chatbot
- **DeepThink Mode**: Advanced reasoning with trace visualization
- **Multimodal**: Images, videos, documents, PDFs
- **Voice Input**: Browser-native speech recognition
- **Web Search**: Real-time information retrieval
- **Lead Generation**: Autonomous web research

### 💼 Enterprise Features
- **Distributed Compute**: Use visitor devices as compute nodes
- **Smart Recommendations**: Collaborative filtering for services
- **Multi-tier Caching**: LRU + Redis for performance
- **Circuit Breakers**: Automatic failure recovery
- **Container Ready**: Docker/Docker Compose deployment

### 🎨 Premium UX
- **Glassmorphism UI**: Bubbly design with spring physics
- **Smooth Animations**: Framer Motion transitions
- **Dark Theme**: Optimized for long sessions
- **Responsive**: Works on all screen sizes

## Environment Variables

Minimal setup (`.env.local`):

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional (for enhanced features)
AGNES_API_KEY=your-key
ZHIPU_API_KEY=your-key
BRAVE_SEARCH_API_KEY=your-key
```

## Common Commands

```bash
# View logs
docker-compose logs -f web

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose build && docker-compose up -d

# Scale web workers
docker-compose up -d --scale web=3
```

## Next Steps

1. **Configure Supabase**: Set up your backend project
2. **Run Migrations**: Apply database schema changes
3. **Customize Branding**: Update logo and colors in `tailwind.config.js`
4. **Deploy to Production**: See `DEPLOYMENT.md` for production guide

## Support

- **Documentation**: `docs/LEAD_GENERATION.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Architecture**: Check `README.md` for system overview

---

**Ready to generate leads? Start chatting with Siddhi now!** 🚀
