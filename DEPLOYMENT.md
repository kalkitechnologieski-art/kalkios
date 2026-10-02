# SIDDHI v4.0 — Enterprise Deployment Guide

## 🚀 Quick Start with Docker Compose

### Prerequisites
- Docker 24+ and Docker Compose 2.20+
- At least 8GB RAM (16GB recommended for WebLLM)
- Node.js 20+ (for local development)

### 1. Environment Setup

Create `.env.local` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers (Optional - fallbacks available)
AGNES_API_KEY=your-agnes-key
ZHIPU_API_KEY=your-zhipu-key
BRAVE_SEARCH_API_KEY=your-brave-key

# Database
POSTGRES_PASSWORD=secure-password-here

# Application
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
NODE_ENV=production
```

### 2. Build and Start Services

```bash
# Build all containers
docker-compose build

# Start services in detached mode
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f web
```

### 3. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:3000 | Next.js application |
| SearXNG | http://localhost:8080 | Open-source search engine |
| Redis | localhost:6379 | Distributed cache |
| PostgreSQL | localhost:5432 | Database |

### 4. Initialize Database

Run migrations on first setup:

```bash
# Connect to Supabase or local Postgres
psql -h localhost -U postgres -d kalkicore

# Run migration files
\i supabase/migrations/20261002000004_distributed_compute.sql
```

## 🔧 Local Development (Without Docker)

### 1. Install Dependencies

```bash
npm install
```

### 2. Start SearXNG (Required for lead generation)

```bash
docker run -d \
  --name searxng \
  -p 8080:8080 \
  -v $(pwd)/searxng:/etc/searxng:rw \
  searxng/searxng:latest
```

### 3. Start Redis (Optional but recommended)

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### 4. Run Development Server

```bash
npm run dev
```

## 📊 Lead Generation Usage

### Via Chat Interface

1. Navigate to `/chat`
2. Click the **Leads** button in the toolbar
3. Enter your search query, e.g.:
   - "Find astrologers in Indore"
   - "Collect contact details of restaurants in Mumbai"
   - "Search yoga studios in Delhi with emails"

4. Siddhi will:
   - Search the web using open-source engines
   - Scrape relevant websites
   - Extract names, emails, phones, addresses
   - Generate a downloadable CSV file

### Programmatic Usage

```typescript
import { leadGenerator } from '@/lib/ai/lead-generator';

const result = await leadGenerator.generateLeads({
  query: 'astrologers',
  location: 'Indore',
  maxResults: 20,
  maxPagesPerSite: 3,
});

// Download CSV
await leadGenerator.downloadCSV(result, 'astrologers-indore.csv');
```

## 🛡️ Production Considerations

### Security

1. **Environment Variables**: Never commit `.env.local` to git
2. **HTTPS**: Use reverse proxy (nginx/caddy) with SSL certificates
3. **Rate Limiting**: Configure in middleware for API protection
4. **CORS**: Restrict allowed origins in production

### Performance

1. **Redis Cache**: Essential for high concurrency
2. **CDN**: Deploy static assets via Cloudflare/Vercel
3. **Database Indexes**: Ensure indexes on frequently queried columns
4. **WebGPU**: Enable for browser-based LLM inference

### Scaling

```yaml
# docker-compose.scale.yml
services:
  web:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 2G
          cpus: '1.5'
```

Scale horizontally:
```bash
docker-compose up -d --scale web=3
```

## 🔍 Troubleshooting

### SearXNG Not Responding

```bash
# Check container health
docker-compose exec searxng wget --no-verbose --tries=1 --spider http://localhost:8080/healthz

# Restart if needed
docker-compose restart searxng
```

### Redis Connection Issues

```bash
# Test connection
docker-compose exec redis redis-cli ping

# Should return: PONG
```

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next node_modules/.cache

# Reinstall dependencies
npm ci

# Rebuild
npm run build
```

### Database Migration Errors

```sql
-- Check existing columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name LIKE 'distributed%';

-- Drop and recreate if needed
ALTER TABLE profiles DROP COLUMN IF EXISTS distributed_compute_consent;
```

## 📈 Monitoring

### Health Checks

All services expose health endpoints:

```bash
# Web app
curl http://localhost:3000/api/health

# SearXNG
curl http://localhost:8080/healthz

# Redis
docker-compose exec redis redis-cli ping
```

### Logs

```bash
# View all logs
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f searxng
```

## 🎯 Feature Checklist

- ✅ Open-source web search (SearXNG + DuckDuckGo + Brave fallback)
- ✅ Intelligent web scraping with semantic analysis
- ✅ Contact extraction (emails, phones, names, addresses)
- ✅ Location-based filtering
- ✅ CSV/Excel export functionality
- ✅ Beautiful lead viewer UI with table/grid modes
- ✅ Container-ready architecture
- ✅ Multi-tier caching (LRU + Redis)
- ✅ Circuit breaker pattern for resilience
- ✅ WebLLM device-side inference
- ✅ Multimodal processing (images, videos, documents)
- ✅ Voice input via Web Speech API
- ✅ Smart recommendations engine

## 🆘 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Ensure all services are healthy: `docker-compose ps`
4. Review this deployment guide for common solutions

---

**Built with ❤️ for enterprise-grade AI-powered lead generation**
