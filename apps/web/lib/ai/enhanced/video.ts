// lib/ai/enhanced/video.ts
import { VideoGenerationOptions, VideoGenerationResult } from './types';
import { videoCache } from './cache';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { videoQueue } from '@/lib/ai/queue';
import { logger } from '@/lib/utils/logger';

export interface VideoProgressEvent {
  type: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  taskId?: string;
  videoId?: string;
}

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
          content: `Expand this short video prompt into a detailed, cinematic description. Include visual style, camera movement, mood, and scene dynamics. Return only the expanded prompt:\n\n"${prompt}"`
        }],
        model: 'llama-3.1-70b-versatile',
        temperature: 0.5,
        max_tokens: 250,
        stream: false,
      });
      return response?.choices?.[0]?.message?.content?.trim() || prompt;
    } catch {
      return prompt;
    }
  }

  async generate(
    options: VideoGenerationOptions,
    onProgress?: (event: VideoProgressEvent) => void
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    const quality = options.quality || 'balanced';

    const optimizedPrompt = options.prompt.length < 50
      ? await this.analyzePrompt(options.prompt)
      : options.prompt;

    const cacheKey = this.getCacheKey(optimizedPrompt);
    if (!this.isServer && options.cache !== false) {
      const cached = videoCache.get(cacheKey);
      if (cached) {
        onProgress?.({ type: 'completed', progress: 100, message: '✅ From cache!' });
        return {
          url: cached,
          taskId: 'cached',
          provider: 'cache',
          resolution: '720P',
          duration: 5,
          quality,
          cache_hit: true,
          time_ms: Date.now() - start,
          progress: 100,
          status: 'completed',
        };
      }
    }

    onProgress?.({ type: 'queued', progress: 10, message: '⏳ Queuing video generation...' });

    const result = await videoQueue.enqueue({
      type: 'video',
      priority: options.priority || 'normal',
      maxRetries: 2,
      retries: 0,
      execute: async () => {
        return this.generateVideo(optimizedPrompt, options, onProgress);
      },
    });

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
    onProgress?: (event: VideoProgressEvent) => void
  ): Promise<Omit<VideoGenerationResult, 'cache_hit' | 'time_ms'>> {
    try {
      return await this.generateVideo25(prompt, options, onProgress);
    } catch (error) {
      logger.warn('[Video] Video 2.5 failed, falling back to Video 2.0:', error);
      onProgress?.({ type: 'processing', progress: 20, message: '🔄 Fallback to Video 2.0...' });
      return await this.generateVideo20(prompt, options, onProgress);
    }
  }

  private async generateVideo25(
    prompt: string,
    options: VideoGenerationOptions,
    onProgress?: (event: VideoProgressEvent) => void
  ): Promise<Omit<VideoGenerationResult, 'cache_hit' | 'time_ms'>> {
    const resolution = options.resolution || '720P';
    const duration = options.duration || 5;
    const aspectRatio = options.aspect_ratio || '16:9';

    onProgress?.({ type: 'processing', progress: 30, message: '🎬 Creating video task...' });

    const body: any = {
      model: resolution === '720P' ? 'agnes-video-2.5-flash' : 'agnes-video-2.5',
      prompt: prompt,
      mode: options.mode || 'text',
      seconds: String(duration),
      size: resolution,
      aspect_ratio: aspectRatio,
    };

    if (options.seed) body.seed = options.seed;

    if (options.mode === 'keyframe') {
      if (options.first_frame) body.first_frame = options.first_frame;
      if (options.last_frame) body.last_frame = options.last_frame;
    }

    if (options.mode === 'reference' && options.images) {
      body.images = options.images;
    }

    if (options.image) {
      const imageData = typeof options.image === 'string'
        ? options.image
        : await this.fileToBase64(options.image);
      body.image = imageData;
    }

    const response = await this.agnes.video(body);
    const videoId = response.video_id;
    const taskId = response.id || response.task_id;

    if (!videoId) {
      throw new Error('No video_id returned from Agnes');
    }

    onProgress?.({ type: 'processing', progress: 50, message: '⏳ Rendering video...' });

    const url = await this.pollVideoStatus(videoId, 'agnes-video-2.5', onProgress);

    return {
      url,
      taskId: taskId || videoId,
      provider: 'agnes-video-2.5',
      resolution,
      duration,
      quality: options.quality || 'balanced',
      progress: 100,
      status: 'completed',
    };
  }

  private async generateVideo20(
    prompt: string,
    options: VideoGenerationOptions,
    onProgress?: (event: VideoProgressEvent) => void
  ): Promise<Omit<VideoGenerationResult, 'cache_hit' | 'time_ms'>> {
    onProgress?.({ type: 'processing', progress: 30, message: '🎬 Creating video task (free tier)...' });

    const body: any = {
      model: 'agnes-video-v2.0',
      prompt: prompt,
      height: 768,
      width: 1152,
      num_frames: 121,
      frame_rate: 24,
    };

    if (options.image) {
      const imageData = typeof options.image === 'string'
        ? options.image
        : await this.fileToBase64(options.image);
      body.image = imageData;
    }

    if (options.mode === 'keyframe' && options.images) {
      body.extra_body = {
        image: options.images,
        mode: 'keyframes',
      };
    }

    const response = await this.agnes.video(body);
    const videoId = response.video_id;
    const taskId = response.id || response.task_id;

    if (!videoId) {
      throw new Error('No video_id returned from Agnes Video 2.0');
    }

    onProgress?.({ type: 'processing', progress: 50, message: '⏳ Rendering video (free tier)...' });

    const url = await this.pollVideoStatus(videoId, 'agnes-video-v2.0', onProgress);

    return {
      url,
      taskId: taskId || videoId,
      provider: 'agnes-video-v2.0',
      resolution: '720P',
      duration: 5,
      quality: options.quality || 'balanced',
      progress: 100,
      status: 'completed',
    };
  }

  private async pollVideoStatus(
    videoId: string,
    modelName: string,
    onProgress?: (event: VideoProgressEvent) => void
  ): Promise<string> {
    let attempts = 0;
    const maxAttempts = 120;
    let delay = 1000;

    while (attempts < maxAttempts) {
      await this.sleep(delay);
      attempts++;

      try {
        const status = await this.agnes.videoStatus(videoId, modelName);

        logger.info(`[Video] Poll ${attempts}: status=${status.status}, progress=${status.progress || 0}`);

        if (status.progress !== undefined) {
          const progress = Math.min(50 + (status.progress / 100) * 45, 95);
          onProgress?.({
            type: 'processing',
            progress,
            message: `⏳ Rendering... ${status.progress || 0}%`,
            videoId,
          });
        }

        if (status.status === 'completed' || status.status === 'succeeded') {
          const url = status.metadata?.url || status.url;
          if (!url) throw new Error('No video URL in completed status');
          onProgress?.({ type: 'completed', progress: 100, message: '✅ Video ready!' });
          return url;
        }

        if (status.status === 'failed' || status.status === 'error') {
          throw new Error(`Video generation failed: ${status.error?.message || 'Unknown error'}`);
        }

        if (status.progress && status.progress < 30 && delay < 2000) {
          delay = Math.min(delay * 1.2, 2000);
        }

      } catch (error) {
        if ((error as any)?.status === 404) {
          continue;
        }
        if (attempts < maxAttempts) {
          logger.warn(`[Video] Status check error (attempt ${attempts}):`, error);
          continue;
        }
        throw error;
      }
    }

    throw new Error('Video generation timed out after 120 attempts');
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(prompt: string): string {
    const hash = this.hashString(prompt);
    return `video:${hash}`;
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
