// ═══ SIDDHI v4.0 BATCH 2 ═══
// Agnes helpers + media queue. Preserves legacy exports
// (generateChat, generateImage, generateVideo) used by lib/ai/index.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { AgnesClient } from '@/lib/providers/agnes/client';
import { logger } from '@/lib/utils/logger';
import type { ChatMessage, ChatOptions, ChatResponse } from './types';

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
  private videoActive = 0;
  private readonly VIDEO_CONCURRENCY = 2; // Increased from 1 to match new concurrency limits

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

  canStartVideo(): boolean { return this.videoActive < this.VIDEO_CONCURRENCY; }
  videoStarted(): void { this.videoActive += 1; }
  videoEnded(): void { this.videoActive = Math.max(0, this.videoActive - 1); }

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

    const result = await client.image({
      model: IMAGE_MODEL,
      prompt: options.prompt,
      size: options.size ?? '2K',
      ratio: options.ratio ?? '16:9',
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

// ─── Video generation with polling ──────────────────────────────────
export async function generateVideoWithPolling(
  options: VideoOptions & {
    onProgress?: (progress: number, stage: string) => void;
    signal?: AbortSignal;
  }
): Promise<{ url: string; jobId: string }> {
  const job = mediaQueue.create('video');
  try {
    // Wait for a video slot (max 1 concurrent)
    if (!mediaQueue.canStartVideo()) {
      options.onProgress?.(0, 'Waiting for video slot...');
      const waitStart = Date.now();
      while (!mediaQueue.canStartVideo() && Date.now() - waitStart < 60_000) {
        await new Promise((r) => setTimeout(r, 500));
        if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      }
      if (!mediaQueue.canStartVideo()) throw new Error('Video queue timeout');
    }

    mediaQueue.videoStarted();
    mediaQueue.update(job.id, { status: 'processing', progress: 5 });
    options.onProgress?.(5, 'Submitting video task...');

    let imageData: string | undefined;
    if (options.image) {
      imageData = typeof options.image === 'string' ? options.image : await fileToDataUrl(options.image);
    }

    const submit = await client.video({
      model: VIDEO_MODEL,
      prompt: options.prompt,
      mode: imageData ? 'reference' : 'text',
      seconds: String(options.duration ?? 5),
      size: options.resolution ?? '720P',
      aspect_ratio: '16:9',
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
      const progress = Math.min(90, 10 + (status.progress ?? 0) * 0.8);
      mediaQueue.update(job.id, { progress });
      options.onProgress?.(progress, `Rendering... ${status.progress ?? 0}%`);

      if (status.status === 'completed' || status.status === 'succeeded') {
        const url = status.metadata?.url ?? status.url;
        if (!url) throw new Error('No URL in completed status');
        mediaQueue.update(job.id, { status: 'completed', progress: 100, completedAt: Date.now() });
        options.onProgress?.(100, 'Done');
        return { url, jobId: job.id };
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
  } finally {
    mediaQueue.videoEnded();
  }
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
