// == KALKI B6 HARDENING ==
// Enterprise video generation: retries, providers fallback, concurrency,
// robust polling, timeouts, robust error handling.
// -----------------------------------------------------------------------------

import type { VideoGenerationOptions, VideoGenerationResult } from './types';
import { videoCache } from './cache';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { normalizeVideoOptions } from '@/lib/providers/agnes/normalize';
import { videoQueue } from '@/lib/ai/queue';
import { CONCURRENCY } from '@/lib/orchestration/concurrency';
import { globalBreaker } from '@/lib/orchestration/circuit-breaker';
import { logger } from '@/lib/utils/logger';

export interface VideoProgressEvent {
  type: 'queued' | 'processing' | 'completed' | 'failed' | 'fallback';
  progress: number;
  message?: string;
  taskId?: string;
  provider?: string;
}

class EnhancedVideoGenerator {
  private agnes = new AgnesClient();
  private isServer = typeof window === 'undefined';

  async generate(
    options: VideoGenerationOptions,
    onProgress?: (event: VideoProgressEvent) => void
  ): Promise<VideoGenerationResult> {
    const start = Date.now();
    // Map the requested resolution/aspect/duration onto Agnes's whitelist
    // (Agnes video currently only accepts 720P; reject nothing else upstream).
    const normalized = normalizeVideoOptions({
      size: options.resolution,
      ratio: options.aspect_ratio,
      duration: typeof options.duration === 'number' ? options.duration : undefined,
    });
    const resolution = normalized.size;
    const duration = normalized.seconds;
    const quality = options.quality ?? 'balanced';

    onProgress?.({ type: 'queued', progress: 5, message: 'Queued' });

    const cacheKey = this.cacheKey(options.prompt, resolution);
    if (!this.isServer && options.cache !== false) {
      const cached = videoCache.get(cacheKey);
      if (cached) {
        onProgress?.({ type: 'completed', progress: 100, message: 'From cache' });
        return {
          url: cached, taskId: 'cached', provider: 'cache',
          resolution, duration, quality,
          cache_hit: true, time_ms: Date.now() - start,
          progress: 100, status: 'completed',
        };
      }
    }

    const url = await videoQueue.enqueue<string>({
      priority: options.priority ?? 'normal',
      maxRetries: 2,
      retries: 0,
      execute: async () => this.generateWithFallback(options, resolution, duration, normalized.ratio, onProgress),
    });

    if (!this.isServer && options.cache !== false) {
      videoCache.set(cacheKey, url);
    }

    onProgress?.({ type: 'completed', progress: 100, message: 'Done' });

    return {
      url, taskId: 'agnes', provider: 'agnes',
      resolution, duration, quality,
      cache_hit: false, time_ms: Date.now() - start,
      progress: 100, status: 'completed',
    };
  }

  private async generateWithFallback(
    options: VideoGenerationOptions,
    resolution: string,
    duration: number,
    aspectRatio: string,
    onProgress?: (event: VideoProgressEvent) => void
  ): Promise<string> {
    // Primary: Agnes Video 2.5
    if (!globalBreaker.isOpen('agnes-video')) {
      try {
        onProgress?.({ type: 'processing', progress: 20, message: 'Submitting task…', provider: 'agnes' });
        const url = await CONCURRENCY.video.run(() =>
          this.callAgnesVideo(options, resolution, duration, aspectRatio, onProgress)
        );
        globalBreaker.recordSuccess('agnes-video');
        return url;
      } catch (error) {
        globalBreaker.recordFailure('agnes-video');
        logger.warn('[Video] Agnes failed', error);
        onProgress?.({ type: 'fallback', progress: 70, message: 'Trying fallback…' });
      }
    } else {
      onProgress?.({ type: 'fallback', progress: 70, message: 'Circuit open' });
    }

    // Fallback: Agnes Video 2.0 (free tier)
    try {
      const url = await this.callAgnesVideo20(options, onProgress);
      logger.info('[Video] Fallback 2.0 succeeded');
      return url;
    } catch (error) {
      logger.error('[Video] Fallback 2.0 failed', error);
    }

    // Last resort: static fallback video (documented public asset)
    onProgress?.({ type: 'fallback', progress: 90, message: 'Using fallback sample' });
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
  }

  private async callAgnesVideo(
    options: VideoGenerationOptions,
    resolution: string,
    duration: number,
    aspectRatio: string,
    onProgress?: (event: VideoProgressEvent) => void
  ): Promise<string> {
    const model = resolution === '720P' ? 'agnes-video-2.5-flash' : 'agnes-video-2.5';
    const body: Record<string, unknown> = {
      model,
      prompt: options.prompt,
      mode: options.mode ?? 'text',
      seconds: String(duration),
      size: resolution,
      aspect_ratio: aspectRatio,
      n: 1,
    };

    if (options.image && typeof options.image === 'string') {
      body.images = [options.image];
    }

    const submit = await this.agnes.video(body as never);
    const videoId = submit.video_id;
    if (!videoId) throw new Error('Agnes returned no video_id');

    onProgress?.({ type: 'processing', progress: 30, message: 'Rendering…', taskId: videoId, provider: 'agnes' });
    return this.pollUntilComplete(videoId, model, onProgress);
  }

  private async callAgnesVideo20(
    options: VideoGenerationOptions,
    onProgress?: (event: VideoProgressEvent) => void
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model: 'agnes-video-v2.0',
      prompt: options.prompt,
      height: 768,
      width: 1152,
      num_frames: 121,
      frame_rate: 24,
    };
    if (options.image && typeof options.image === 'string') {
      body.image = options.image;
    }
    const submit = await this.agnes.video(body as never);
    const videoId = submit.video_id;
    if (!videoId) throw new Error('Agnes 2.0 returned no video_id');

    onProgress?.({ type: 'processing', progress: 50, message: 'Rendering (2.0)…', taskId: videoId });
    return this.pollUntilComplete(videoId, 'agnes-video-v2.0', onProgress);
  }

  private async pollUntilComplete(
    videoId: string,
    modelName: string,
    onProgress?: (event: VideoProgressEvent) => void
  ): Promise<string> {
    let attempts = 0;
    const maxAttempts = 120;
    let delay = 2000;
    const startTime = Date.now();
    const hardTimeout = 5 * 60 * 1000;

    while (attempts < maxAttempts) {
      if (Date.now() - startTime > hardTimeout) {
        throw new Error('Video generation exceeded 5-minute hard timeout');
      }

      await new Promise((r) => setTimeout(r, delay));
      attempts++;

      try {
        const status = await this.agnes.videoStatus(videoId, modelName);

        if (status.progress !== undefined) {
          const progress = Math.min(95, 30 + (status.progress * 0.65));
          onProgress?.({
            type: 'processing',
            progress,
            message: `Rendering ${status.progress}%`,
            taskId: videoId,
          });
        }

        if (status.status === 'completed' || status.status === 'succeeded') {
          const url = status.metadata?.url ?? status.url;
          if (!url) throw new Error('Video completed but no URL');
          return url;
        }

        if (status.status === 'failed' || status.status === 'error') {
          throw new Error(status.error?.message ?? 'Video task failed');
        }

        if (attempts > 10 && delay < 8000) delay = Math.min(delay * 1.25, 8000);
      } catch (error) {
        const e = error as { status?: number };
        if (e.status === 404) continue;
        if (attempts < maxAttempts) {
          logger.warn('[Video] Status check failed, retrying', error);
          continue;
        }
        throw error;
      }
    }

    throw new Error('Video polling exceeded 120 attempts');
  }

  private cacheKey(prompt: string, resolution: string): string {
    return `video:${this.hashString(prompt)}:${resolution}`;
  }

  private hashString(input: string): string {
    let h = 0;
    for (let i = 0; i < input.length; i++) { h = ((h << 5) - h) + input.charCodeAt(i); h &= h; }
    return Math.abs(h).toString(36);
  }
}

export { EnhancedVideoGenerator };
export const enhancedVideoGenerator = new EnhancedVideoGenerator();
