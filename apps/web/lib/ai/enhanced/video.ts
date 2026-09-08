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
