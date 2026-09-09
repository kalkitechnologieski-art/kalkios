// lib/ai/queue.ts
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
  startedAt?: number;
  completedAt?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  progressMessage?: string;
}

export interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  tasks: QueueTask[];
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
  private listeners: ((stats: QueueStats) => void)[] = [];

  constructor(maxConcurrency = 3, rateLimit = 20, rateWindow = 60000) {
    this.maxConcurrency = maxConcurrency;
    this.rateLimit = rateLimit;
    this.rateWindow = rateWindow;
  }

  onStats(callback: (stats: QueueStats) => void) {
    this.listeners.push(callback);
  }

  private notify() {
    const stats = this.getStats();
    for (const listener of this.listeners) {
      listener(stats);
    }
  }

  enqueue<T>(
    task: Omit<QueueTask<T>, 'id' | 'createdAt' | 'resolve' | 'reject' | 'status' | 'progress' | 'progressMessage'>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const queueTask: QueueTask<T> = {
        ...task,
        id,
        createdAt: Date.now(),
        status: 'pending',
        progress: 0,
        resolve,
        reject,
      };
      this.queue.push(queueTask);
      this.notify();
      this.processQueue();
    });
  }

  async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrency) {
      if (!this.canExecute()) {
        const waitTime = this.getWaitTime();
        await this.sleep(waitTime);
        continue;
      }

      const task = this.getNextTask();
      if (!task) break;

      task.status = 'processing';
      task.startedAt = Date.now();
      this.activeCount++;
      this.taskTimestamps.push(Date.now());
      this.notify();
      this.executeTask(task);
    }

    this.processing = false;
  }

  private getNextTask(): QueueTask | undefined {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.queue.sort((a, b) => {
      const pa = priorityOrder[a.priority] || 1;
      const pb = priorityOrder[b.priority] || 1;
      if (pa !== pb) return pa - pb;
      return a.createdAt - b.createdAt;
    });
    const task = this.queue.shift();
    if (task) task.status = 'processing';
    return task;
  }

  private async executeTask(task: QueueTask): Promise<void> {
    try {
      const result = await task.execute();
      task.status = 'completed';
      task.completedAt = Date.now();
      task.progress = 100;
      this.activeCount--;
      this.completedCount++;
      this.notify();
      task.resolve(result);
    } catch (error) {
      if (task.retries < task.maxRetries) {
        task.retries++;
        task.status = 'pending';
        logger.warn(`[Queue] Task ${task.id} failed, retrying (${task.retries}/${task.maxRetries})`, error);
        const backoff = Math.min(1000 * Math.pow(2, task.retries), 30000);
        await this.sleep(backoff);
        this.queue.unshift(task);
        this.notify();
        this.processQueue();
      } else {
        task.status = 'failed';
        this.activeCount--;
        this.failedCount++;
        this.notify();
        logger.error(`[Queue] Task ${task.id} failed after ${task.maxRetries} retries`, error);
        task.reject(error);
      }
    } finally {
      this.notify();
      this.processQueue();
    }
  }

  updateProgress(taskId: string, progress: number, message?: string) {
    const task = this.queue.find(t => t.id === taskId);
    if (task) {
      task.progress = Math.min(100, progress);
      if (message) task.progressMessage = message;
      this.notify();
    }
  }

  private canExecute(): boolean {
    const now = Date.now();
    this.taskTimestamps = this.taskTimestamps.filter(t => now - t < this.rateWindow);
    return this.taskTimestamps.length < this.rateLimit;
  }

  private getWaitTime(): number {
    if (this.taskTimestamps.length === 0) return 0;
    const oldest = this.taskTimestamps[0];
    const now = Date.now();
    return Math.max(0, oldest + this.rateWindow - now + 100);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(): QueueStats {
    return {
      pending: this.queue.filter(t => t.status === 'pending').length,
      active: this.activeCount,
      completed: this.completedCount,
      failed: this.failedCount,
      tasks: this.queue,
    };
  }

  clear(): void {
    this.queue = [];
    this.activeCount = 0;
    this.completedCount = 0;
    this.failedCount = 0;
    this.taskTimestamps = [];
    this.notify();
  }

  getTask(id: string): QueueTask | undefined {
    return this.queue.find(t => t.id === id);
  }
}

export const imageQueue = new TaskQueue(2, 20, 60000);
export const videoQueue = new TaskQueue(1, 1, 60000);
export const chatQueue = new TaskQueue(5, 30, 60000);
