// ═══ SIDDHI v4.0 BATCH 2 ═══
// Agnes helpers + media queue. Preserves legacy exports
// (generateChat, generateImage, generateVideo) used by lib/ai/index.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { AgnesClient } from '@/lib/providers/agnes/client';
import { logger } from '@/lib/utils/logger';
import type { ChatMessage, ChatOptions, ChatResponse } from './types';
import { normalizeImageOptions, normalizeVideoOptions, AGNES_VIDEO_SECONDS } from '@/lib/providers/agnes/normalize';
import { videoScheduler, type VideoQueueStatus } from '@/lib/media/video-queue';

const IMAGE_MODEL = 'agnes-image-2.1-flash';
const VIDEO_MODEL = 'agnes-video-2.5-flash';
const CHAT_MODEL = 'agnes-2.5-flash';

const client = new AgnesClient();

// ─── Chat (legacy) ──────────────────────────────────────────────────
export async function generateChat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
  const { temperature = 0.7, max_tokens = 2000 } = options;
  const result = await client.chat({
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    model: CHAT_MODEL,
    temperature,
    max_tokens,
  });
  return {
    content: result.choices?.[0]?.message?.content ?? 'No response.',
    reasoning: result.choices?.[0]?.message?.reasoning_content,
    tokens: result.usage?.total_tokens ?? 0,
    provider: 'agnes',
  };
}

// ─── Image (legacy + queue) ─────────────────────────────────────────
export interface ImageOptions {
  prompt: string;
  image?: string | File;
  size?: string;
  ratio?: string;
  negativePrompt?: string;
  steps?: number;
}

export async function generateImage(options: ImageOptions): Promise<string> {
  const { url } = await generateImageWithRetry(options);
  return url;
}

// ─── Video (legacy + queue) ─────────────────────────────────────────
export interface VideoOptions {
  prompt: string;
  image?: string | File;
  duration?: number;
  resolution?: string;
  motion?: number;
}

export async function generateVideo(options: VideoOptions): Promise<string> {
  const { url } = await generateVideoWithPolling(options);
  return url;
}

// ─── Media Queue (Legacy - kept for backward compatibility) ──────────
// New code should use EnterpriseMediaQueue from lib/media/enterprise-media-queue.ts
interface MediaJob {
  id: string;
  type: 'image' | 'video';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

class MediaQueue {
  private jobs = new Map<string, MediaJob>();

  create(type: 'image' | 'video'): MediaJob {
    const job: MediaJob = {
      id: this.id(),
      type,
      status: 'queued',
      progress: 0,
      startedAt: Date.now(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  update(id: string, patch: Partial<MediaJob>): void {
    const job = this.jobs.get(id);
    if (job) Object.assign(job, patch);
  }

  gc(): void {
    const cutoff = Date.now() - 3_600_000;
    for (const [id, job] of this.jobs) {
      if (job.completedAt && job.completedAt < cutoff) this.jobs.delete(id);
    }
  }

  private id(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  }
}

export const mediaQueue = new MediaQueue();

// ─── Image generation with retry ────────────────────────────────────
export async function generateImageWithRetry(
  options: ImageOptions & {
    onProgress?: (progress: number, stage: string) => void;
    signal?: AbortSignal;
  }
): Promise<{ url: string; jobId: string }> {
  const job = mediaQueue.create('image');
  try {
    options.onProgress?.(10, 'Analyzing prompt...');
    mediaQueue.update(job.id, { status: 'processing', progress: 10 });

    let imageData: string | undefined;
    if (options.image) {
      imageData = typeof options.image === 'string' ? options.image : await fileToDataUrl(options.image);
    }

    const extra: Record<string, unknown> = { response_format: 'url' };
    if (options.negativePrompt) extra.negative_prompt = options.negativePrompt;
    if (options.steps) extra.steps = options.steps;
    if (imageData) extra.image = [imageData];

    const normalized = normalizeImageOptions({ size: options.size, ratio: options.ratio });

    const result = await client.image({
      model: IMAGE_MODEL,
      prompt: options.prompt,
      size: normalized.size,
      ratio: normalized.ratio,
      extra_body: extra,
    });

    const url = result.data?.[0]?.url;
    if (!url) throw new Error('No image URL returned');

    mediaQueue.update(job.id, { status: 'completed', progress: 100, completedAt: Date.now() });
    options.onProgress?.(100, 'Done');
    return { url, jobId: job.id };
  } catch (error) {
    mediaQueue.update(job.id, { status: 'failed', error: String(error), completedAt: Date.now() });
    logger.error('[Agnes] Image generation failed', error);
    throw error;
  }
}

// ─── Video generation (FIFO queue + polling) ────────────────────────
// Free-tier Agnes allows ONE video submission per minute, so every request is
// funnelled through the server-side scheduler which spaces submissions, tracks
// a per-user daily budget, and reports live queue position/ETA to the caller.
// We pin the free tier to the shortest/lowest resolution.
export async function generateVideoWithPolling(
  options: VideoOptions & {
    onProgress?: (progress: number, stage: string) => void;
    onQueue?: (status: VideoQueueStatus) => void;
    userId?: string;
    signal?: AbortSignal;
  }
): Promise<{ url: string; jobId: string }> {
  const normalized = normalizeVideoOptions({
    size: options.resolution,
    duration: typeof options.duration === 'number' ? options.duration : undefined,
  });
  // Free tier: force the cheapest render — shortest duration, 720P.
  const freeSeconds = AGNES_VIDEO_SECONDS[0]!;
  const seconds = Math.min(normalized.seconds, freeSeconds);
  const userId = options.userId ?? 'anonymous';

  options.onProgress?.(0, 'Entering video queue…');

  const url = await videoScheduler.enqueue({
    userId,
    seconds,
    signal: options.signal,
    onUpdate: (status) => {
      options.onQueue?.(status);
      if (status.phase === 'queued' && status.position > 0) {
        options.onProgress?.(5, `You're #${status.position} in queue · ~${Math.max(1, Math.round(status.etaSeconds / 60))} min wait`);
      } else if (status.phase === 'processing') {
        options.onProgress?.(15, 'Rendering your video…');
      }
    },
    execute: async () => {
      const job = mediaQueue.create('video');
      try {
        mediaQueue.update(job.id, { status: 'processing', progress: 15 });

        let imageData: string | undefined;
        if (options.image) {
          imageData = typeof options.image === 'string' ? options.image : await fileToDataUrl(options.image);
        }

        const submit = await client.video({
          model: VIDEO_MODEL,
          prompt: options.prompt,
          mode: imageData ? 'reference' : 'text',
          seconds: String(seconds),
          size: normalized.size,
          aspect_ratio: normalized.ratio,
          ...(imageData ? { images: [imageData] } : {}),
        });

        const videoId = submit.video_id;
        if (!videoId) throw new Error('No video_id returned');

        let attempts = 0;
        const maxAttempts = 120;
        let delay = 2_000;

        while (attempts < maxAttempts) {
          if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
          await new Promise((r) => setTimeout(r, delay));
          attempts++;

          const status = await client.videoStatus(videoId, VIDEO_MODEL);
          const progress = Math.min(90, 20 + (status.progress ?? 0) * 0.7);
          mediaQueue.update(job.id, { progress });
          options.onProgress?.(progress, `Rendering… ${status.progress ?? 0}%`);

          if (status.status === 'completed' || status.status === 'succeeded') {
            const url = status.metadata?.url ?? status.url;
            if (!url) throw new Error('No URL in completed status');
            mediaQueue.update(job.id, { status: 'completed', progress: 100, completedAt: Date.now() });
            options.onProgress?.(100, 'Done');
            return url;
          }
          if (status.status === 'failed' || status.status === 'error') {
            throw new Error(status.error?.message ?? 'Video failed');
          }
          if (attempts > 10 && delay < 8_000) delay = Math.min(delay * 1.2, 8_000);
        }

        throw new Error('Video generation timeout');
      } catch (error) {
        mediaQueue.update(job.id, { status: 'failed', error: String(error), completedAt: Date.now() });
        logger.error('[Agnes] Video generation failed', error);
        throw error;
      }
    },
  });

  return { url, jobId: `queued_${userId}_${Date.now()}` };
}

// ─── Helpers ────────────────────────────────────────────────────────
async function fileToDataUrl(file: File): Promise<string> {
  if (typeof window === 'undefined') throw new Error('File upload not supported on server');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => mediaQueue.gc(), 300_000);
}
