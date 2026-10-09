// ═══ SIDDHI B7 ═══
// Server-side FIFO video queue. Agnes free tier = 1 video request/minute, so
// we run exactly one job at a time, space submissions by MIN_SPACING_MS, and
// report each caller's live queue position + ETA so the UI can show a real
// wait instead of a "quota exhausted" error. Also enforces a per-user daily
// seconds budget (resets at midnight IST) so one account can't burn the shared
// free quota for everyone.
// ─────────────────────────────────────────────────────────────────────────────

import { logger } from '@/lib/utils/logger';

export type VideoQueuePhase = 'queued' | 'processing' | 'done' | 'failed' | 'canceled';

export interface VideoQueueStatus {
  phase: VideoQueuePhase;
  position: number;     // 1-based queue position; 0 once this job is running
  pending: number;      // total jobs still waiting (including this one)
  etaSeconds: number;   // rough wait estimate for THIS job
  retryAfterSec?: number; // present on quota/limit rejections
  error?: string;
}

export interface VideoQueueJob {
  userId: string;
  seconds: number;
  execute: () => Promise<string>;
  onUpdate?: (status: VideoQueueStatus) => void;
  signal?: AbortSignal;
}

interface InternalJob extends VideoQueueJob {
  id: string;
  settled: boolean;
  resolve: (url: string) => void;
  reject: (reason: unknown) => void;
}

// Agnes free video: 1 submission per minute. We add a small safety margin.
const MIN_SPACING_MS = 62_000;
// Average end-to-end render we advertise for ETA math (seconds).
const AVG_RENDER_SECONDS = 90;
// Per-user daily video budget (free tier). Override via env in seconds.
const FREE_DAILY_VIDEO_SECONDS = Number(process.env.AGNES_FREE_DAILY_VIDEO_SECONDS ?? 60);

function istDate(now: Date): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

class VideoQueue {
  private pending: InternalJob[] = [];
  private running = false;
  private lastStartAt = 0;
  private activeJob: InternalJob | null = null;
  private dailyUsage = new Map<string, { date: string; seconds: number }>();

  /** Enqueue a render. Resolves with the video URL, or rejects on failure/quota. */
  enqueue(job: VideoQueueJob): Promise<string> {
    // Daily budget guard — reject before occupying a slot.
    const remaining = this.remainingSeconds(job.userId);
    if (remaining < job.seconds) {
      const status: VideoQueueStatus = {
        phase: 'failed',
        position: 0,
        pending: this.pending.length,
        etaSeconds: 0,
        retryAfterSec: this.secondsUntilMidnightIST(),
        error: 'Daily free video quota reached. Try again tomorrow (after midnight IST), or use image mode.',
      };
      try { job.onUpdate?.(status); } catch { /* ignore */ }
      return Promise.reject(new Error(status.error));
    }

    let resolve!: (url: string) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<string>((res, rej) => { resolve = res; reject = rej; });

    const internal: InternalJob = {
      ...job,
      id: `vid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      settled: false,
      resolve,
      reject,
    };

    // Cancellation from client aborts the wait, not an in-flight render.
    job.signal?.addEventListener('abort', () => {
      if (internal.settled) return;
      const idx = this.pending.indexOf(internal);
      if (idx >= 0) {
        this.pending.splice(idx, 1);
        internal.settled = true;
        try { job.onUpdate?.({ phase: 'canceled', position: 0, pending: this.pending.length, etaSeconds: 0 }); } catch { /* ignore */ }
        reject(new DOMException('Canceled', 'AbortError'));
        this.broadcast();
      }
    });

    this.pending.push(internal);
    this.commitSeconds(job.userId, job.seconds);
    this.broadcast();
    void this.schedule();
    return promise;
  }

  private remainingSeconds(userId: string): number {
    const today = istDate(new Date());
    const u = this.dailyUsage.get(userId);
    if (!u || u.date !== today) return FREE_DAILY_VIDEO_SECONDS;
    return Math.max(0, FREE_DAILY_VIDEO_SECONDS - u.seconds);
  }

  private commitSeconds(userId: string, seconds: number): void {
    const today = istDate(new Date());
    const u = this.dailyUsage.get(userId);
    if (!u || u.date !== today) this.dailyUsage.set(userId, { date: today, seconds });
    else u.seconds += seconds;
  }

  private secondsUntilMidnightIST(): number {
    const now = new Date();
    // Compute next IST midnight in epoch terms.
    const istOffsetMs = 5.5 * 3600 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);
    const istTomorrow = new Date(Date.UTC(
      istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() + 1, 0, 0, 0,
    ));
    return Math.max(1, Math.round((istTomorrow.getTime() - istOffsetMs - now.getTime()) / 1000));
  }

  /** Push fresh position/ETA to every job (active + waiting). */
  private broadcast(): void {
    const count = this.pending.length;
    if (this.activeJob) {
      try {
        this.activeJob.onUpdate?.({
          phase: 'processing',
          position: 0,
          pending: count,
          etaSeconds: AVG_RENDER_SECONDS,
        });
      } catch { /* ignore */ }
    }
    this.pending.forEach((job, i) => {
      const ahead = i; // jobs still in front of it
      const etaSeconds = Math.round((ahead * (MIN_SPACING_MS / 1000)) + AVG_RENDER_SECONDS);
      try {
        job.onUpdate?.({
          phase: 'queued',
          position: ahead + 1,
          pending: count,
          etaSeconds,
        });
      } catch { /* ignore listener errors */ }
    });
  }

  private async schedule(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      while (this.pending.length > 0) {
        const job = this.pending[0];
        if (!job) break;

        // Respect free-tier spacing between submissions.
        const sinceLast = Date.now() - this.lastStartAt;
        const waitMs = this.lastStartAt === 0 ? 0 : MIN_SPACING_MS - sinceLast;
        if (waitMs > 0) {
          this.broadcast(); // keep the waiting job's ETA live during the pause
          await this.sleep(waitMs);
          if (job.settled) continue; // canceled while waiting
        }

        // Move head into "active".
        this.pending.shift();
        this.activeJob = job;
        this.lastStartAt = Date.now();
        this.broadcast();

        try {
          const url = await job.execute();
          job.settled = true;
          try { job.onUpdate?.({ phase: 'done', position: 0, pending: this.pending.length, etaSeconds: 0 }); } catch { /* ignore */ }
          job.resolve(url);
        } catch (error) {
          job.settled = true;
          // A failed render shouldn't permanently charge the daily budget.
          this.refundSeconds(job.userId, job.seconds);
          const msg = error instanceof Error ? error.message : String(error);
          try { job.onUpdate?.({ phase: 'failed', position: 0, pending: this.pending.length, etaSeconds: 0, error: msg }); } catch { /* ignore */ }
          logger.warn('[VideoQueue] job failed', msg);
          job.reject(error);
        } finally {
          this.activeJob = null;
          this.broadcast();
        }
      }
    } finally {
      this.running = false;
    }
  }

  private refundSeconds(userId: string, seconds: number): void {
    const u = this.dailyUsage.get(userId);
    if (u) u.seconds = Math.max(0, u.seconds - seconds);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  stats() {
    return { pending: this.pending.length, running: this.running, active: this.activeJob?.id ?? null };
  }
}

export const videoScheduler = new VideoQueue();
