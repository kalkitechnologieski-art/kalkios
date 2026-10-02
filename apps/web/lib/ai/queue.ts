// == KALKI B6 HARDENING ==
// Multi-lane task queue with priorities, concurrency, rate windows, retries.
// -----------------------------------------------------------------------------

import { logger } from '@/lib/utils/logger';

export type QueueLane = 'image' | 'video' | 'chat' | 'search' | 'extraction';

export interface QueueTask<T = unknown> {
  id: string;
  lane: QueueLane;
  priority: 'high' | 'normal' | 'low';
  execute: () => Promise<T>;
  retries: number;
  maxRetries: number;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  progressMessage?: string;
  signal?: AbortSignal;
}

export interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  tasks: QueueTask[];
}

interface LaneConfig {
  maxConcurrency: number;
  rateLimit: number;
  rateWindowMs: number;
}

const LANE_CONFIG: Record<QueueLane, LaneConfig> = {
  image:      { maxConcurrency: 2, rateLimit: 20, rateWindowMs: 60_000 },
  video:      { maxConcurrency: 1, rateLimit: 1,  rateWindowMs: 60_000 },
  chat:       { maxConcurrency: 8, rateLimit: 60, rateWindowMs: 60_000 },
  search:     { maxConcurrency: 12, rateLimit: 300, rateWindowMs: 60_000 },
  extraction: { maxConcurrency: 6, rateLimit: 60, rateWindowMs: 60_000 },
};

class Lane {
  readonly lane: QueueLane;
  private queue: QueueTask[] = [];
  private activeCount = 0;
  private config: LaneConfig;
  private taskTimestamps: number[] = [];
  private completedCount = 0;
  private failedCount = 0;
  private processing = false;
  private listeners: Set<(stats: QueueStats) => void> = new Set();

  constructor(lane: QueueLane) {
    this.lane = lane;
    this.config = LANE_CONFIG[lane];
  }

  onStats(cb: (stats: QueueStats) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    const stats = this.getStats();
    for (const l of this.listeners) {
      try { l(stats); } catch { /* ignore */ }
    }
  }

  enqueue<T>(task: Omit<QueueTask<T>, 'id' | 'createdAt' | 'resolve' | 'reject' | 'status' | 'progress' | 'lane'>): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const qt = {
        ...task,
        id,
        lane: this.lane,
        createdAt: Date.now(),
        status: 'pending' as const,
        progress: 0,
        resolve,
        reject,
      } as unknown as QueueTask;
      this.queue.push(qt);
      this.notify();
      void this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0 && this.activeCount < this.config.maxConcurrency) {
        if (!this.canExecute()) {
          const wait = this.getWaitTime();
          await this.sleep(Math.min(wait, 2000));
          continue;
        }

        const task = this.pickNext();
        if (!task) break;

        task.status = 'processing';
        task.startedAt = Date.now();
        this.activeCount += 1;
        this.taskTimestamps.push(Date.now());
        this.notify();
        void this.executeTask(task);
      }
    } finally {
      this.processing = false;
    }
  }

  private pickNext(): QueueTask | undefined {
    const order = { high: 0, normal: 1, low: 2 };
    this.queue.sort((a, b) => {
      const pa = order[a.priority];
      const pb = order[b.priority];
      if (pa !== pb) return pa - pb;
      return a.createdAt - b.createdAt;
    });
    return this.queue.shift();
  }

  private async executeTask(task: QueueTask): Promise<void> {
    try {
      const result = await task.execute();
      task.status = 'completed';
      task.completedAt = Date.now();
      task.progress = 100;
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.completedCount += 1;
      this.notify();
      task.resolve(result);
    } catch (error) {
      if (task.retries < task.maxRetries) {
        task.retries += 1;
        task.status = 'pending';
        logger.warn(`[Queue:${this.lane}] Task ${task.id} retry ${task.retries}/${task.maxRetries}`, error);
        const backoff = Math.min(1000 * 2 ** task.retries, 30_000);
        await this.sleep(backoff);
        this.queue.unshift(task);
        this.notify();
        void this.processQueue();
      } else {
        task.status = 'failed';
        this.activeCount = Math.max(0, this.activeCount - 1);
        this.failedCount += 1;
        this.notify();
        logger.error(`[Queue:${this.lane}] Task ${task.id} failed`, error);
        task.reject(error);
      }
    } finally {
      this.notify();
      void this.processQueue();
    }
  }

  updateProgress(taskId: string, progress: number, message?: string): void {
    const task = this.queue.find((t) => t.id === taskId);
    if (task) {
      task.progress = Math.min(100, progress);
      if (message) task.progressMessage = message;
      this.notify();
    }
  }

  private canExecute(): boolean {
    const now = Date.now();
    this.taskTimestamps = this.taskTimestamps.filter((t) => now - t < this.config.rateWindowMs);
    return this.taskTimestamps.length < this.config.rateLimit;
  }

  private getWaitTime(): number {
    if (this.taskTimestamps.length === 0) return 0;
    const oldest = this.taskTimestamps[0]!;
    return Math.max(0, oldest + this.config.rateWindowMs - Date.now() + 50);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStats(): QueueStats {
    return {
      pending: this.queue.filter((t) => t.status === 'pending').length,
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
      tasks: [...this.queue],
    };
  }

  getTask(id: string): QueueTask | undefined {
    return this.queue.find((t) => t.id === id);
  }
}

// Lane singletons
export const imageQueue = new Lane('image');
export const videoQueue = new Lane('video');
export const chatQueue = new Lane('chat');
export const searchQueue = new Lane('search');
export const extractionQueue = new Lane('extraction');

// Aggregate metrics
export function allQueueStats(): Record<QueueLane, QueueStats> {
  return {
    image: imageQueue.getStats(),
    video: videoQueue.getStats(),
    chat: chatQueue.getStats(),
    search: searchQueue.getStats(),
    extraction: extractionQueue.getStats(),
  };
}
