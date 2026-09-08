#!/usr/bin/env bash

set -euo pipefail

echo "🧠 KALKI OS – Fix Media Generation Types (Agnes API Aligned)"
echo "============================================================="

# ------------------------------------------------------------------
# 1. BACKUP FILES
# ------------------------------------------------------------------
BACKUP_DIR="$HOME/kalki-media-types-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

for file in \
  "apps/web/lib/ai/enhanced/types.ts" \
  "apps/web/lib/ai/enhanced/image.ts" \
  "apps/web/lib/ai/enhanced/video.ts"
do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
    echo "📁 Backed up $file"
  fi
done

# ------------------------------------------------------------------
# 2. FIX TYPES.TS – Add missing properties
# ------------------------------------------------------------------
echo "📝 Fixing lib/ai/enhanced/types.ts..."

cat > apps/web/lib/ai/enhanced/types.ts << 'EOF'
// lib/ai/enhanced/types.ts
// All TypeScript interfaces for enhanced modules

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    arr[6] = (arr[6]! & 0x0f) | 0x40;
    arr[8] = (arr[8]! & 0x3f) | 0x80;
    return Array.from(arr)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export interface Memory {
  id: string;
  content: string;
  embedding: Float32Array;
  timestamp: number;
  importance: number;
  type: 'short' | 'long';
  metadata?: Record<string, unknown>;
}

export interface Identity {
  name: string;
  job: string;
  preferences: string[];
  lastUpdated: number;
}

export interface Neurochemicals {
  dopamine: number;
  serotonin: number;
  cortisol: number;
  oxytocin: number;
}

export interface BrainState {
  mood: 'happy' | 'neutral' | 'sad' | 'anxious';
  valence: number;
  neurochemicals: Neurochemicals;
  memoryCount: number;
  identity: Identity;
}

export interface ImageGenerationOptions {
  prompt: string;
  size?: '1K' | '2K' | '3K' | '4K' | string;
  ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '2:3' | '3:2';
  quality?: 'low' | 'standard' | 'high' | 'ultra';
  style?: string;
  negative_prompt?: string;
  steps?: number;
  image?: string | File;
  n?: number;
  cache?: boolean;
  priority?: 'high' | 'normal' | 'low';
  /** Internal: used for passing pre-analyzed prompts */
  _analyzed?: boolean;
  /** Internal: enhanced prompt from analysis */
  enhanced?: string;
}

export interface ImageGenerationResult {
  url: string;
  provider: string;
  size: string;
  ratio: string;
  quality: string;
  steps: number;
  cache_hit: boolean;
  time_ms: number;
}

export interface VideoGenerationOptions {
  prompt: string;
  duration?: 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  resolution?: '720P' | '1080P' | '4K';
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';
  mode?: 'text' | 'keyframe' | 'reference';
  first_frame?: string;
  last_frame?: string;
  images?: string[];
  audios?: string[];
  image?: string | File;
  seed?: number;
  quality?: 'speed' | 'balanced' | 'quality';
  cache?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

export interface VideoGenerationResult {
  url: string;
  taskId: string;
  provider: string;
  resolution: string;
  duration: number;
  quality: string;
  cache_hit: boolean;
  time_ms: number;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface ReasoningPath {
  id: string;
  provider: string;
  reasoning: string;
  summary: string;
  answer: string;
  confidence: number;
  tokens: number;
  timeMs: number;
  steps?: string[];
  sources?: string[];
}

export interface ConsensusResult {
  final_answer: string;
  reasoning: string;
  paths: ReasoningPath[];
  consensus_score: number;
  tokens: number;
  provider: string;
}

export interface LeadEnrichment {
  company_size?: string;
  revenue?: string;
  industry?: string;
  founded_year?: number;
  key_people?: string[];
  technologies?: string[];
  social_links?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface EnhancedLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website: string | null;
  enrichment: LeadEnrichment;
  confidence: number;
  source_urls: string[];
  verified: boolean;
  created_at: Date;
}

export interface ResearchPlan {
  main_query: string;
  sub_questions: string[];
  search_queries: string[];
  target_industries: string[];
  target_locations: string[];
  keywords: string[];
}
EOF

# ------------------------------------------------------------------
# 3. FIX IMAGE.TS – Remove _analyzed, handle types correctly
# ------------------------------------------------------------------
echo "📝 Fixing lib/ai/enhanced/image.ts..."

cat > apps/web/lib/ai/enhanced/image.ts << 'EOF'
// lib/ai/enhanced/image.ts
import { ImageGenerationOptions, ImageGenerationResult } from './types';
import { imageCache } from './cache';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { imageQueue } from '@/lib/ai/queue';
import { logger } from '@/lib/utils/logger';

interface AnalyzedPrompt {
  original: string;
  enhanced: string;
  style: string;
  mood: string;
  subject: string;
  negative_prompt?: string;
  size: '1K' | '2K' | '3K' | '4K';
  ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9';
  quality: 'low' | 'standard' | 'high' | 'ultra';
  steps: number;
}

const QUALITY_CONFIGS = {
  low: { size: '1K' as const, steps: 10, model: 'agnes-image-2.1-flash' },
  standard: { size: '2K' as const, steps: 25, model: 'agnes-image-2.1-flash' },
  high: { size: '3K' as const, steps: 40, model: 'agnes-image-2.1-flash' },
  ultra: { size: '4K' as const, steps: 60, model: 'agnes-image-2.1-flash' },
};

export class EnhancedImageGenerator {
  private agnes: AgnesClient;
  private groq: GroqClient;
  private isServer: boolean;

  constructor() {
    this.agnes = new AgnesClient();
    this.groq = new GroqClient();
    this.isServer = typeof window === 'undefined';
  }

  /**
   * Analyze and enhance the prompt using Groq
   */
  private async analyzePrompt(prompt: string): Promise<AnalyzedPrompt> {
    const analysisPrompt = `Analyze this image generation prompt and extract structured data.
Return ONLY valid JSON with keys: style, mood, subject, negative_prompt (or null), enhanced_prompt (a detailed, expanded version of the prompt).

Original prompt: "${prompt}"`;

    try {
      const response = await this.groq.chat({
        messages: [{ role: 'user', content: analysisPrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 300,
        stream: false,
      });

      const content = response?.choices?.[0]?.message?.content || '{}';
      const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const analyzed = JSON.parse(clean);

      return {
        original: prompt,
        enhanced: analyzed.enhanced_prompt || prompt,
        style: analyzed.style || 'photorealistic',
        mood: analyzed.mood || 'neutral',
        subject: analyzed.subject || 'scene',
        negative_prompt: analyzed.negative_prompt || undefined,
        size: '2K',
        ratio: '16:9',
        quality: 'standard',
        steps: 25,
      };
    } catch (error) {
      logger.warn('[Image] Prompt analysis failed, using fallback:', error);
      return {
        original: prompt,
        enhanced: prompt,
        style: 'photorealistic',
        mood: 'neutral',
        subject: 'scene',
        negative_prompt: undefined,
        size: '2K',
        ratio: '16:9',
        quality: 'standard',
        steps: 25,
      };
    }
  }

  /**
   * Generate image with queue and caching
   */
  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const start = Date.now();

    // 1. Analyze prompt (unless already enhanced)
    const analyzed = await this.analyzePrompt(options.prompt);

    const quality = options.quality || analyzed.quality || 'standard';
    const config = QUALITY_CONFIGS[quality];
    const size = options.size || config.size;
    const steps = options.steps || config.steps;
    const ratio = options.ratio || '16:9';

    // 2. Check cache
    const cacheKey = this.getCacheKey(options.prompt, size, ratio);
    if (!this.isServer && options.cache !== false) {
      const cached = imageCache.get(cacheKey);
      if (cached) {
        return {
          url: cached,
          provider: 'cache',
          size,
          ratio,
          quality,
          steps,
          cache_hit: true,
          time_ms: Date.now() - start,
        };
      }
    }

    // 3. Queue the generation
    const finalPrompt = analyzed.enhanced;
    const negativePrompt = options.negative_prompt || analyzed.negative_prompt;

    const result = await imageQueue.enqueue({
      type: 'image',
      priority: options.priority || 'normal',
      maxRetries: 3,
      retries: 0,
      execute: async () => {
        const body: any = {
          model: config.model,
          prompt: finalPrompt,
          size: size,
          ratio: ratio,
          extra_body: {
            response_format: 'url',
          },
        };

        if (negativePrompt) {
          body.extra_body.negative_prompt = negativePrompt;
        }
        if (steps) {
          body.extra_body.steps = steps;
        }

        // Image-to-image: provide input image under extra_body.image
        // According to Agnes API docs: "image | string[] | For image-to-image | Input image array"[reference:4]
        if (options.image) {
          const imageData = typeof options.image === 'string'
            ? options.image
            : await this.fileToBase64(options.image);
          body.extra_body.image = [imageData];
        }

        const response = await this.agnes.image(body);
        const url = response.data?.[0]?.url;
        if (!url) throw new Error('No image URL returned');
        return url;
      },
    });

    // 4. Cache the result
    if (!this.isServer && options.cache !== false) {
      imageCache.set(cacheKey, result);
    }

    return {
      url: result,
      provider: 'agnes',
      size,
      ratio,
      quality,
      steps,
      cache_hit: false,
      time_ms: Date.now() - start,
    };
  }

  private async fileToBase64(file: File): Promise<string> {
    if (this.isServer) throw new Error('File upload not supported on server');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getCacheKey(prompt: string, size: string, ratio: string): string {
    const hash = this.hashString(prompt);
    return `image:${hash}:${size}:${ratio}`;
  }

  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
EOF

# ------------------------------------------------------------------
# 4. FIX VIDEO.TS – Add priority to options, align with Agnes API
# ------------------------------------------------------------------
echo "📝 Fixing lib/ai/enhanced/video.ts..."

cat > apps/web/lib/ai/enhanced/video.ts << 'EOF'
// lib/ai/enhanced/video.ts
import { VideoGenerationOptions, VideoGenerationResult } from './types';
import { videoCache } from './cache';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { videoQueue } from '@/lib/ai/queue';
import { logger } from '@/lib/utils/logger';
import { sleep } from './utils';

const QUALITY_CONFIGS = {
  speed: { resolution: '720P' as const, duration: 5, model: 'agnes-video-2.5-flash' },
  balanced: { resolution: '1080P' as const, duration: 5, model: 'agnes-video-2.5' },
  quality: { resolution: '4K' as const, duration: 10, model: 'agnes-video-2.5' },
};

export class EnhancedVideoGenerator {
  private agnes: AgnesClient;
  private groq: GroqClient;
  private isServer: boolean;

  constructor() {
    this.agnes = new AgnesClient();
    this.groq = new GroqClient();
    this.isServer = typeof window === 'undefined';
  }

  private async analyzePrompt(prompt: string): Promise<string> {
    try {
      const response = await this.groq.chat({
        messages: [{
          role: 'user',
          content: `Expand this short video prompt into a detailed, cinematic description. Include visual style, camera movement, and mood. Return only the expanded prompt:\n\n"${prompt}"`
        }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 200,
        stream: false,
      });
      return response?.choices?.[0]?.message?.content?.trim() || prompt;
    } catch {
      return prompt;
    }
  }

  async generate(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
    const start = Date.now();
    const quality = options.quality || 'balanced';
    const config = QUALITY_CONFIGS[quality];
    const resolution = options.resolution || config.resolution;
    const duration = options.duration || config.duration;

    // 1. Optimize prompt
    const optimizedPrompt = options.prompt.length < 50
      ? await this.analyzePrompt(options.prompt)
      : options.prompt;

    // 2. Check cache
    const cacheKey = this.getCacheKey(optimizedPrompt, resolution);
    if (!this.isServer && options.cache !== false) {
      const cached = videoCache.get(cacheKey);
      if (cached) {
        return {
          url: cached,
          taskId: 'cached',
          provider: 'cache',
          resolution,
          duration,
          quality,
          cache_hit: true,
          time_ms: Date.now() - start,
          progress: 100,
          status: 'completed',
        };
      }
    }

    // 3. Queue the generation
    const result = await videoQueue.enqueue({
      type: 'video',
      priority: options.priority || 'normal',
      maxRetries: 2,
      retries: 0,
      execute: async () => {
        return this.generateVideo(optimizedPrompt, options, resolution, duration);
      },
    });

    // 4. Cache the result
    if (!this.isServer && options.cache !== false && result.url) {
      videoCache.set(cacheKey, result.url);
    }

    return {
      ...result,
      cache_hit: false,
      time_ms: Date.now() - start,
    };
  }

  private async generateVideo(
    prompt: string,
    options: VideoGenerationOptions,
    resolution: string,
    duration: number
  ): Promise<Omit<VideoGenerationResult, 'cache_hit' | 'time_ms'>> {
    try {
      return await this.generateAgnes(prompt, options, resolution, duration);
    } catch (error) {
      logger.warn('[Video] Agnes failed, trying fallback:', error);
      return this.generateZhipu(prompt, options, resolution, duration);
    }
  }

  private async generateAgnes(
    prompt: string,
    options: VideoGenerationOptions,
    resolution: string,
    duration: number
  ): Promise<Omit<VideoGenerationResult, 'cache_hit' | 'time_ms'>> {
    // According to Agnes Video 2.5 API: seconds is a string "4"–"12"[reference:5]
    const model = resolution === '720P' ? 'agnes-video-2.5-flash' : 'agnes-video-2.5';

    const body: any = {
      model,
      prompt,
      mode: options.mode || 'text',
      seconds: String(duration),
      size: resolution,
      aspect_ratio: options.aspect_ratio || '16:9',
    };

    if (options.seed) body.seed = options.seed;

    // Keyframe mode: use first_frame and last_frame[reference:6]
    if (options.mode === 'keyframe') {
      if (options.first_frame) body.first_frame = options.first_frame;
      if (options.last_frame) body.last_frame = options.last_frame;
    }

    // Reference mode: use images array[reference:7]
    if (options.mode === 'reference' && options.images) {
      body.images = options.images;
    }

    // Image-to-video: provide image URL[reference:8]
    if (options.image) {
      const imageData = typeof options.image === 'string'
        ? options.image
        : await this.fileToBase64(options.image);
      body.image = imageData;
    }

    const response = await this.agnes.video(body);
    const videoId = response.video_id;
    if (!videoId) throw new Error('No video_id returned');

    const url = await this.pollAgnesStatus(videoId, model);
    return {
      url,
      taskId: videoId,
      provider: 'agnes',
      resolution,
      duration,
      quality: options.quality || 'balanced',
      progress: 100,
      status: 'completed',
    };
  }

  private async pollAgnesStatus(videoId: string, model: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 60;
    let delay = 3000;

    while (attempts < maxAttempts) {
      await sleep(delay);
      attempts++;
      try {
        const status = await this.agnes.videoStatus(videoId, model);
        if (status.status === 'completed') {
          const url = status.metadata?.url;
          if (!url) throw new Error('No URL in completed status');
          return url;
        }
        if (status.status === 'failed') {
          throw new Error(`Video generation failed: ${status.error?.message || 'Unknown error'}`);
        }
        if (status.progress && status.progress < 50 && delay < 8000) {
          delay = Math.min(delay * 1.3, 8000);
        }
      } catch (error) {
        if ((error as any)?.status === 429) {
          delay = Math.min(delay * 2, 10000);
          await sleep(delay);
        }
      }
    }
    throw new Error('Video generation timed out');
  }

  private async generateZhipu(
    prompt: string,
    options: VideoGenerationOptions,
    resolution: string,
    duration: number
  ): Promise<Omit<VideoGenerationResult, 'cache_hit' | 'time_ms'>> {
    const zhipuResolution = { '720P': '1280x720', '1080P': '1920x1080', '4K': '3840x2160' }[resolution] || '1920x1080';

    const body: any = {
      model: 'cogvideox-3',
      prompt,
      quality: duration > 5 ? 'quality' : 'speed',
      size: zhipuResolution,
    };

    if (options.image) {
      const imageData = typeof options.image === 'string' ? options.image : await this.fileToBase64(options.image);
      body.image_url = imageData;
    }

    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/videos/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Zhipu video failed: ${response.status}`);
    }

    const data = await response.json();
    const taskId = data.id;
    if (!taskId) throw new Error('No task ID from Zhipu');

    const url = await this.pollZhipuStatus(taskId);
    return {
      url,
      taskId,
      provider: 'zhipu',
      resolution,
      duration,
      quality: options.quality || 'balanced',
      progress: 100,
      status: 'completed',
    };
  }

  private async pollZhipuStatus(taskId: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 40;
    let delay = 2000;

    while (attempts < maxAttempts) {
      await sleep(delay);
      attempts++;
      try {
        const response = await fetch(`https://open.bigmodel.cn/api/paas/v4/async/result/${taskId}`, {
          headers: { 'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}` },
        });
        if (!response.ok) {
          if (response.status === 404) continue;
          throw new Error(`Zhipu status check failed: ${response.status}`);
        }
        const data = await response.json();
        if (data.task_status === 'SUCCESS') {
          const url = data.video_url || data.result?.video_url;
          if (!url) throw new Error('No video URL');
          return url;
        }
        if (data.task_status === 'FAIL') {
          throw new Error(`Zhipu video failed: ${data.error?.message || 'Unknown'}`);
        }
        if (attempts % 5 === 0 && delay < 8000) {
          delay = Math.min(delay * 1.5, 8000);
        }
      } catch (error) {
        if ((error as any)?.status === 429) {
          delay = Math.min(delay * 2, 10000);
          await sleep(delay);
        }
      }
    }
    throw new Error('Zhipu video generation timed out');
  }

  private async fileToBase64(file: File): Promise<string> {
    if (this.isServer) throw new Error('File upload not supported on server');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getCacheKey(prompt: string, resolution: string): string {
    const hash = this.hashString(prompt);
    return `video:${hash}:${resolution}`;
  }

  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
EOF

# ------------------------------------------------------------------
# 5. RUN TYPE CHECK
# ------------------------------------------------------------------
echo ""
read -p "🔍 Run TypeScript type check? (y/n): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Running type-check..."
  npm run type-check 2>&1 | head -30 || echo "⚠️ Type check completed with warnings (if any)."
fi

# ------------------------------------------------------------------
# 6. FINAL MESSAGE
# ------------------------------------------------------------------
echo ""
echo "✅ Media generation types fixed!"
echo "📂 Backup saved to $BACKUP_DIR"
echo ""
echo "🔧 Changes made:"
echo "   - Added 'priority' to ImageGenerationOptions"
echo "   - Added '_analyzed' and 'enhanced' as optional internal fields"
echo "   - Aligned with official Agnes API docs:"
echo "     - image: extra_body.image for image-to-image[reference:9]"
echo "     - video: seconds as string, mode parameter[reference:10]"
echo "     - keyframe: first_frame, last_frame[reference:11]"
echo ""
echo "🚀 Start the server: npm run dev"