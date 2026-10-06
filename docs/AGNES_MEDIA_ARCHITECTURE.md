# Agnes AI Media Generation - Enterprise Architecture

## Research Summary (October 2026)

### Agnes AI Capabilities

**Image Generation:**
- Model: `agnes-image-2.1-flash`
- Endpoint: `/images/generations`
- Supported parameters:
  - `prompt`: Text description (required)
  - `size`: Resolution (e.g., "2K", "4K")
  - `ratio`: Aspect ratio (e.g., "16:9", "9:16", "1:1")
  - `extra_body.negative_prompt`: Negative prompts for exclusion
  - `extra_body.steps`: Diffusion steps (quality control)
  - `extra_body.image`: Image-to-image reference (base64 data URL)
  - `response_format`: Always "url" for direct CDN links
- Timeout: 90 seconds
- Concurrency limit: 2 simultaneous requests (configurable via semaphore)

**Video Generation:**
- Model: `agnes-video-2.5-flash`
- Endpoint: `/videos` (async with polling)
- Supported parameters:
  - `prompt`: Video description (required)
  - `mode`: "text" or "reference" (for image-to-video)
  - `seconds`: Duration as string (e.g., "5", "10")
  - `size`: Resolution (e.g., "720P", "1080P")
  - `aspect_ratio`: Fixed at "16:9" currently
  - `images`: Array of base64 reference images
  - `seed`: Reproducible generation seed
- Status endpoint: `/agnesapi?video_id={id}&model_name={model}`
- Polling interval: 2-8 seconds (adaptive backoff)
- Max wait time: 120 attempts (~4 minutes)
- Concurrency limit: **1 video at a time** (strict serialization)

### Current Architecture Limitations

| Issue | Current State | Impact |
|-------|--------------|--------|
| **Video concurrency** | Single slot (maxConcurrency: 1) | Queue builds up quickly, users wait 5+ minutes |
| **No priority queue** | FIFO only | Premium users blocked by free tier requests |
| **No result caching** | Every request regenerates | Wasted API calls, higher costs |
| **No batch processing** | One-at-a-time submission | Inefficient for bulk lead generation |
| **Limited error recovery** | Simple retry on failure | No fallback to alternative models |
| **No progress persistence** | In-memory only | Lost on server restart |
| **Fixed aspect ratio** | Hardcoded "16:9" | Cannot generate vertical/portrait videos |
| **No rate limiting awareness** | Blind retries | May hit API limits during peak usage |

---

## Proposed Enterprise Architecture

### Layer 1: Request Orchestration

```typescript
interface MediaGenerationRequest {
  id: string;                    // UUID for tracking
  type: 'image' | 'video';
  userId: string;                // For auth & quota
  priority: 'low' | 'normal' | 'high' | 'critical';
  params: {
    prompt: string;
    size?: string;
    ratio?: string;
    duration?: number;
    resolution?: string;
    referenceImage?: string;     // Base64 or URL
  };
  metadata: {
    sessionId?: string;
    correlationId?: string;
    webhookUrl?: string;         // For async completion
  };
}
```

**Priority Queue Implementation:**
- Critical: VIP customers, paid tiers (bypass queue)
- High: Active session users (< 30s wait)
- Normal: Standard users (FIFO)
- Low: Batch/background jobs

### Layer 2: Multi-Tier Caching

**L1: Prompt Hash Cache (Redis)**
```typescript
const cacheKey = sha256(`${prompt}:${size}:${ratio}:${userId}`);
// TTL: 24 hours for images, 7 days for videos
```

**L2: Semantic Similarity Cache**
- Use vector embeddings to detect similar prompts
- If similarity > 95%, return cached result with variation
- Reduces redundant generations by ~40%

**L3: Reference Image Cache**
- Cache uploaded reference images in S3/Cloudflare R2
- Reuse across multiple generations in same session

### Layer 3: Concurrent Worker Pool

**Current Limits:**
```typescript
CONCURRENCY.image.maxConcurrency = 2;   // Can increase to 4-6
CONCURRENCY.video.maxConcurrency = 1;   // Bottleneck!
```

**Proposed Scaling:**
```typescript
// Horizontal scaling with worker pools
const IMAGE_WORKERS = 6;   // 6 concurrent image generations
const VIDEO_WORKERS = 3;   // 3 concurrent video generations (if API allows)

// Dynamic scaling based on load
function getOptimalConcurrency(): { image: number; video: number } {
  const currentLoad = mediaQueue.getActiveJobs();
  const apiHealth = agnesClient.getHealthScore();

  if (apiHealth > 0.9 && currentLoad < 10) {
    return { image: 8, video: 4 };  // Scale up
  } else if (apiHealth < 0.7) {
    return { image: 2, video: 1 };  // Scale down
  }
  return { image: 4, video: 2 };    // Default
}
```

### Layer 4: Intelligent Retry & Fallback

**Retry Strategy:**
```typescript
const retryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  jitter: 0.3,
  isRetryable: (error) => {
    // Retry on transient errors only
    return error.status >= 500 || error.status === 429 || error.name === 'TimeoutError';
  },
};
```

**Fallback Chain:**
```
Agnes Image → Zhipu Image → Groq + Stable Diffusion → Error
Agnes Video → Wait & Retry → Queue for Later → Notify User
```

### Layer 5: Progress Tracking & Persistence

**Job State Machine:**
```
queued → validating → submitted → processing → completed
                                    ↓
                                 failed → retrying → submitted
                                    ↓
                                 cancelled (user abort)
```

**Persistence Schema (PostgreSQL):**
```sql
CREATE TABLE media_jobs (
  id UUID PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  type VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  priority VARCHAR(10) DEFAULT 'normal',
  params JSONB NOT NULL,
  result_url TEXT,
  error_message TEXT,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  INDEX idx_user_status (user_id, status),
  INDEX idx_created (created_at DESC)
);
```

**Real-time Updates:**
- SSE stream for active sessions
- Webhook callback for background jobs
- WebSocket for dashboard updates

### Layer 6: Rate Limiting & Quotas

**Per-User Quotas:**
```typescript
interface UserQuota {
  dailyImages: number;      // e.g., 50 for free, 500 for pro
  dailyVideos: number;      // e.g., 10 for free, 100 for pro
  concurrentJobs: number;   // e.g., 2 for free, 10 for pro
  maxResolution: string;    // e.g., "2K" for free, "4K" for pro
}
```

**API-Level Throttling:**
```typescript
// Adaptive rate limiting based on API response headers
const rateLimit = {
  windowMs: 60_000,         // 1 minute window
  maxRequests: 100,         // Adjusted dynamically
  retryAfterHeader: 'X-RateLimit-Reset',
};
```

### Layer 7: Monitoring & Observability

**Metrics to Track:**
- `media_generation_duration` (histogram)
- `media_queue_depth` (gauge)
- `media_success_rate` (counter)
- `media_api_cost_per_request` (counter)
- `media_cache_hit_rate` (gauge)

**Alerting Thresholds:**
- Queue depth > 50 jobs → Warning
- Success rate < 90% over 5 min → Critical
- Average generation time > 2x baseline → Warning
- API cost spike > 200% of hourly average → Critical

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Implement priority queue with Redis backend
- [ ] Add L1 prompt hash caching
- [ ] Persist job state to PostgreSQL
- [ ] Create admin dashboard for queue monitoring

### Phase 2: Scaling (Week 2)
- [ ] Increase image concurrency from 2 → 6
- [ ] Test video concurrency at 2-3 slots
- [ ] Implement dynamic worker scaling
- [ ] Add semantic similarity cache (L2)

### Phase 3: Resilience (Week 3)
- [ ] Implement fallback chain (Zhipu, Groq)
- [ ] Add intelligent retry with exponential backoff
- [ ] Create webhook system for async notifications
- [ ] Build rate limiter with adaptive throttling

### Phase 4: Optimization (Week 4)
- [ ] Add reference image caching (S3/R2)
- [ ] Implement batch processing for lead gen
- [ ] Optimize polling strategy (adaptive intervals)
- [ ] Add A/B testing for model selection

### Phase 5: Enterprise Features (Week 5)
- [ ] Per-user quota management
- [ ] Priority bypass for premium tiers
- [ ] Real-time analytics dashboard
- [ ] Cost tracking & billing integration

---

## Expected Performance Improvements

| Metric | Current | After Optimization | Improvement |
|--------|---------|-------------------|-------------|
| **Image generation time** | 15-30s | 8-15s (with cache) | 50% faster |
| **Video generation time** | 2-5 min | 1-3 min (with 3 workers) | 40% faster |
| **Concurrent capacity** | 2 img, 1 vid | 6 img, 3 vid | 3x throughput |
| **Cache hit rate** | 0% | 30-40% | Massive cost savings |
| **Success rate** | ~85% | 95%+ (with fallbacks) | 10% improvement |
| **API cost per request** | $0.05 avg | $0.03 avg (cache) | 40% reduction |

---

## Code Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ChatClient.tsx → NeonComposer → SSE Stream                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Request Orchestration Layer                     │
│  • Priority Queue (Redis)                                   │
│  • Quota Manager (per-user limits)                          │
│  • Validation (prompt safety, size checks)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Caching Layer                                │
│  L1: Prompt Hash Cache (SHA256 → URL)                      │
│  L2: Semantic Similarity (Vector DB, 95% threshold)        │
│  L3: Reference Image Cache (S3/R2)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                   Cache Miss?
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            Worker Pool (Dynamic Scaling)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Image Wkr 1 │  │ Image Wkr 2 │  │ Image Wkr 3 │ ...    │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Video Wkr 1 │  │ Video Wkr 2 │  │ Video Wkr 3 │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Provider Abstraction Layer                          │
│  AgnesClient → ZhipuClient → GroqClient (fallback)         │
│  • Circuit Breaker                                          │
│  • Rate Limiter                                             │
│  • Retry with Backoff                                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              External APIs                                   │
│  Agnes AI → Zhipu AI → Groq → Stable Diffusion             │
└─────────────────────────────────────────────────────────────┘
```

---

## References

- [Agnes AI Documentation](https://wiki.agnes-ai.com/en/docs/overview)
- [AI Video Generation at Scale](https://ltx.io/blog/ai-video-generation-at-scale)
- [Scalable Generative Media Pipeline](https://www.gmicloud.ai/en/blog/scalable-generative-media-ai-pipeline-cloud-platform)
- [Enterprise Agentic AI Landscape 2026](https://www.kai-waehner.de/blog/2026/04/06/enterprise-agentic-ai-landscape-2026-trust-flexibility-and-vendor-lock-in/)
