// lib/ai/queue.ts
// Production-grade queue system with concurrency control, retries, and rate limiting.

import { logger } from '@/lib/utils/logger';

export interface QueueTask<T = any> {
  id: string;
  type: 'image' | 'video' | 'chat';
  priority: 'high' | 'normal' | 'low';
  execute: () => Promise<T>;
  retries: number;
  maxRetries: number;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  createdAt: number;
}

interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
}

export class TaskQueue {
  private queue: QueueTask[] = [];
  private activeCount = 0;
  private maxConcurrency: number;
  private rateLimit: number;
  private rateWindow: number;
  private taskTimestamps: number[] = [];
  private completedCount = 0;
  private failedCount = 0;
  private processing = false;

  constructor(
    maxConcurrency = 3,
    rateLimit = 20,
    rateWindow = 60000 // 1 minute
  ) {
    this.maxConcurrency = maxConcurrency;
    this.rateLimit = rateLimit;
    this.rateWindow = rateWindow;
  }

  /**
   * Add a task to the queue
   */
  enqueue<T>(task: Omit<QueueTask<T>, 'id' | 'createdAt' | 'resolve' | 'reject'>): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const queueTask: QueueTask<T> = {
        ...task,
        id,
        createdAt: Date.now(),
        resolve,
        reject,
      };
      this.queue.push(queueTask);
      this.processQueue();
    });
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrency) {
      // Check rate limit
      if (!this.canExecute()) {
        const waitTime = this.getWaitTime();
        await this.sleep(waitTime);
        continue;
      }

      const task = this.getNextTask();
      if (!task) break;

      this.activeCount++;
      this.taskTimestamps.push(Date.now());
      this.executeTask(task);
    }

    this.processing = false;
  }

  /**
   * Get the next highest priority task
   */
  private getNextTask(): QueueTask | undefined {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.queue.sort((a, b) => {
      const pa = priorityOrder[a.priority] || 1;
      const pb = priorityOrder[b.priority] || 1;
      if (pa !== pb) return pa - pb;
      return a.createdAt - b.createdAt;
    });
    return this.queue.shift();
  }

  /**
   * Execute a task with retry logic
   */
  private async executeTask(task: QueueTask): Promise<void> {
    try {
      const result = await task.execute();
      this.activeCount--;
      this.completedCount++;
      task.resolve(result);
    } catch (error) {
      if (task.retries < task.maxRetries) {
        task.retries++;
        logger.warn(`[Queue] Task ${task.id} failed, retrying (${task.retries}/${task.maxRetries})`, error);
        // Re-queue with backoff
        const backoff = Math.min(1000 * Math.pow(2, task.retries), 30000);
        await this.sleep(backoff);
        this.queue.unshift(task);
      } else {
        this.activeCount--;
        this.failedCount++;
        logger.error(`[Queue] Task ${task.id} failed after ${task.maxRetries} retries`, error);
        task.reject(error);
      }
    } finally {
      this.processQueue();
    }
  }

  /**
   * Check if we can execute based on rate limit
   */
  private canExecute(): boolean {
    const now = Date.now();
    this.taskTimestamps = this.taskTimestamps.filter(t => now - t < this.rateWindow);
    return this.taskTimestamps.length < this.rateLimit;
  }

  /**
   * Get wait time until next available slot
   */
  private getWaitTime(): number {
    if (this.taskTimestamps.length === 0) return 0;
    const oldest = this.taskTimestamps[0];
    const now = Date.now();
    return Math.max(0, (oldest + this.rateWindow) - now + 100);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return {
      pending: this.queue.length,
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
    };
  }

  /**
   * Clear the queue (for emergencies)
   */
  clear(): void {
    this.queue = [];
    this.activeCount = 0;
    this.completedCount = 0;
    this.failedCount = 0;
    this.taskTimestamps = [];
  }
}

// Singleton instances for different tasks
export const imageQueue = new TaskQueue(2, 20, 60000);
export const videoQueue = new TaskQueue(1, 1, 60000);
export const chatQueue = new TaskQueue(5, 30, 60000);
