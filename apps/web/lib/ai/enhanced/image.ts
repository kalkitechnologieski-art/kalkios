// == KALKI B6 HARDENING ==
// Enterprise image generation: retries, fallback providers, concurrency,
// robust error handling, cache integration, progress events.
// -----------------------------------------------------------------------------

import type { ImageGenerationOptions, ImageGenerationResult } from './types';
import { imageCache } from './cache';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { normalizeImageOptions } from '@/lib/providers/agnes/normalize';
import { imageQueue } from '@/lib/ai/queue';
import { CONCURRENCY, raceFirstSuccess } from '@/lib/orchestration/concurrency';
import { globalBreaker } from '@/lib/orchestration/circuit-breaker';
import { logger } from '@/lib/utils/logger';

export interface ImageProgressEvent {
  type: 'queued' | 'processing' | 'completed' | 'failed' | 'fallback';
  progress: number;
  message?: string;
  provider?: string;
}

interface AttemptResult {
  url: string;
  provider: string;
}

class EnhancedImageGenerator {
  private agnes = new AgnesClient();
  private isServer = typeof window === 'undefined';

  async generate(
    options: ImageGenerationOptions,
    onProgress?: (event: ImageProgressEvent) => void
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    // Clamp incoming options to Agnes's whitelist so we never send an unknown
    // size/ratio (Agnes returns 400 instead of generating).
    const normalized = normalizeImageOptions({ size: options.size, ratio: options.ratio });
    const size = normalized.size;
    const ratio = normalized.ratio;
    const quality = options.quality ?? 'standard';

    onProgress?.({ type: 'processing', progress: 10, message: 'Analyzing prompt…' });

    const cacheKey = this.cacheKey(options.prompt, size, ratio);
    if (!this.isServer && options.cache !== false) {
      const cached = imageCache.get(cacheKey);
      if (cached) {
        onProgress?.({ type: 'completed', progress: 100, message: 'From cache' });
        return {
          url: cached,
          provider: 'cache',
          size, ratio, quality,
          steps: options.steps ?? 25,
          cache_hit: true,
          time_ms: Date.now() - start,
        };
      }
    }

    onProgress?.({ type: 'queued', progress: 15, message: 'Queued' });

    const result = await imageQueue.enqueue<string>({
      priority: options.priority ?? 'normal',
      maxRetries: 3,
      retries: 0,
      execute: async () => {
        const url = await this.generateWithFallback(options, size, ratio, onProgress);
        return url;
      },
    });

    if (!this.isServer && options.cache !== false) {
      imageCache.set(cacheKey, result);
    }

    onProgress?.({ type: 'completed', progress: 100, message: 'Done' });

    return {
      url: result,
      provider: 'agnes',
      size, ratio, quality,
      steps: options.steps ?? 25,
      cache_hit: false,
      time_ms: Date.now() - start,
    };
  }

  private async generateWithFallback(
    options: ImageGenerationOptions,
    size: string,
    ratio: string,
    onProgress?: (event: ImageProgressEvent) => void
  ): Promise<string> {
    // Primary path: Agnes with concurrency + circuit breaker
    if (!globalBreaker.isOpen('agnes-image')) {
      try {
        onProgress?.({ type: 'processing', progress: 40, message: 'Generating with Agnes…', provider: 'agnes' });
        const url = await CONCURRENCY.image.run(() => this.callAgnes(options, size, ratio));
        globalBreaker.recordSuccess('agnes-image');
        return url;
      } catch (error) {
        globalBreaker.recordFailure('agnes-image');
        logger.warn('[Image] Agnes failed, trying fallback', error);
        onProgress?.({ type: 'fallback', progress: 55, message: 'Trying fallback…' });
      }
    } else {
      onProgress?.({ type: 'fallback', progress: 55, message: 'Circuit open, using fallback' });
    }

    // Fallback: PollyWasm-style external generator (via public service)
    try {
      const url = await this.callFallbackGenerator(options, size, ratio);
      logger.info('[Image] Fallback generator succeeded');
      return url;
    } catch (error) {
      logger.error('[Image] Fallback generator failed', error);
    }

    // Last resort: retry Agnes without concurrency cap after a delay
    await new Promise((r) => setTimeout(r, 1500));
    return this.callAgnes(options, size, ratio);
  }

  private async callAgnes(options: ImageGenerationOptions, size: string, ratio: string): Promise<string> {
    const imageData = options.image
      ? (typeof options.image === 'string' ? options.image : null)
      : null;

    const body: Record<string, unknown> = {
      model: 'agnes-image-2.1-flash',
      prompt: options.prompt,
      size,
      ratio,
      n: options.n ?? 1,
      extra_body: { response_format: 'url' },
    };
    if (options.negative_prompt) {
      (body.extra_body as Record<string, unknown>).negative_prompt = options.negative_prompt;
    }
    if (options.steps) {
      (body.extra_body as Record<string, unknown>).steps = options.steps;
    }
    if (imageData) {
      (body.extra_body as Record<string, unknown>).image = [imageData];
    }

    const response = await this.agnes.image(body as never);
    const url = response.data?.[0]?.url;
    if (!url) throw new Error('Agnes returned no URL');
    return url;
  }

  private async callFallbackGenerator(
    options: ImageGenerationOptions,
    size: string,
    ratio: string
  ): Promise<string> {
    // Uses Pollinations — free, keyless, reliable
    const encodedPrompt = encodeURIComponent(options.prompt.slice(0, 400));
    const [w, h] = this.parseSizeToDims(size, ratio);
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;

    // Validate that the URL responds with an image
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const head = await fetch(url, { method: 'HEAD', signal: controller.signal });
      if (!head.ok) throw new Error(`Fallback HEAD ${head.status}`);
      const ct = head.headers.get('content-type') ?? '';
      if (!ct.startsWith('image/')) throw new Error(`Fallback wrong content-type ${ct}`);
      return url;
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseSizeToDims(size: string, ratio: string): [number, number] {
    const base = size === '1K' ? 1024 : size === '2K' ? 2048 : size === '3K' ? 3072 : 4096;
    const [rW, rH] = ratio.split(':').map((n) => parseInt(n, 10));
    const rw = Number.isFinite(rW) && rW ? rW : 16;
    const rh = Number.isFinite(rH) && rH ? rH : 9;
    if (rw >= rh) {
      const w = base;
      const h = Math.round(base * (rh / rw));
      return [w, h];
    }
    const h = base;
    const w = Math.round(base * (rw / rh));
    return [w, h];
  }

  private cacheKey(prompt: string, size: string, ratio: string): string {
    return `image:${this.hashString(prompt)}:${size}:${ratio}`;
  }

  private hashString(input: string): string {
    let h = 0;
    for (let i = 0; i < input.length; i++) { h = ((h << 5) - h) + input.charCodeAt(i); h &= h; }
    return Math.abs(h).toString(36);
  }
}

export class EnhancedImageGeneratorCompat extends EnhancedImageGenerator {}
export { EnhancedImageGenerator };
export const enhancedImageGenerator = new EnhancedImageGenerator();
