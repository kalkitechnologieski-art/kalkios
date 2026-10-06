// apps/web/lib/media/enterprise-media-queue.ts
// ─────────────────────────────────────────────────────────────────────────────
// Enterprise-grade media generation queue with priority scheduling,
// intelligent caching, and dynamic worker scaling.
// ─────────────────────────────────────────────────────────────────────────────

import { logger } from '@/lib/utils/logger';
import type { ImageOptions, VideoOptions } from '@/lib/ai/agnes';

export type MediaPriority = 'low' | 'normal' | 'high' | 'critical';
export type MediaStatus = 'queued' | 'validating' | 'submitted' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface MediaJobParams {
  prompt: string;
  size?: string;
  ratio?: string;
  duration?: number;
  resolution?: string;
  referenceImage?: string; // Base64 or URL
  negativePrompt?: string;
  steps?: number;
}

export interface MediaJob {
  id: string;
  userId: string;
  type: 'image' | 'video';
  priority: MediaPriority;
  status: MediaStatus;
  params: MediaJobParams;
  progress: number;
  resultUrl?: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  startedAt?: number;
  correlationId?: string;
  webhookUrl?: string;
}

interface QueueMetrics {
  totalJobs: number;
  activeJobs: number;
  queuedJobs: number;
  failedJobs: number;
  avgWaitTime: number;
  avgProcessingTime: number;
}

/**
 * Priority-based media queue with intelligent scheduling
 */
export class EnterpriseMediaQueue {
  private jobs = new Map<string, MediaJob>();
  private priorityQueues: Record<MediaPriority, MediaJob[]> = {
    critical: [],
    high: [],
    normal: [],
    low: [],
  };
  
  private activeWorkers = {
    image: 0,
    video: 0,
  };
  
  private maxWorkers = {
    image: 2,  // Start conservative, will scale dynamically
    video: 1,  // Strict limit due to API constraints
  };
  
  private metrics = {
    totalProcessed: 0,
    totalFailed: 0,
    totalWaitTime: 0,
    totalProcessingTime: 0,
  };

  /**
   * Add job to priority queue
   */
  enqueue(job: Omit<MediaJob, 'status' | 'progress' | 'createdAt' | 'updatedAt'>): MediaJob {
    const now = Date.now();
    const mediaJob: MediaJob = {
      ...job,
      status: 'queued',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(mediaJob.id, mediaJob);
    this.priorityQueues[mediaJob.priority].push(mediaJob);
    
    logger.info(`[MediaQueue] Enqueued ${mediaJob.type} job ${mediaJob.id} (priority: ${mediaJob.priority})`);
    
    return mediaJob;
  }

  /**
   * Get next job based on priority ordering
   */
  dequeue(type: 'image' | 'video'): MediaJob | null {
    // Check priorities in order: critical → high → normal → low
    const priorities: MediaPriority[] = ['critical', 'high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const queue = this.priorityQueues[priority];
      const index = queue.findIndex(job => job.type === type && job.status === 'queued');
      
      if (index !== -1) {
        const job = queue.splice(index, 1)[0];
        job.status = 'validating';
        job.updatedAt = Date.now();
        job.startedAt = Date.now();
        
        logger.info(`[MediaQueue] Dequeued ${type} job ${job.id} (priority: ${priority})`);
        return job;
      }
    }
    
    return null;
  }

  /**
   * Check if we can start a new job based on worker availability
   */
  canStartJob(type: 'image' | 'video'): boolean {
    return this.activeWorkers[type] < this.maxWorkers[type];
  }

  /**
   * Mark job as started and increment worker count
   */
  startJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.progress = 5;
    job.updatedAt = Date.now();
    
    this.activeWorkers[job.type]++;
    
    logger.info(`[MediaQueue] Started job ${jobId}, active workers: ${this.activeWorkers[job.type]}/${this.maxWorkers[job.type]}`);
  }

  /**
   * Update job progress
   */
  updateProgress(jobId: string, progress: number, status?: MediaStatus): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.progress = Math.min(100, Math.max(0, progress));
    if (status) job.status = status;
    job.updatedAt = Date.now();
  }

  /**
   * Mark job as completed
   */
  completeJob(jobId: string, resultUrl: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.progress = 100;
    job.resultUrl = resultUrl;
    job.completedAt = Date.now();
    job.updatedAt = Date.now();
    
    this.activeWorkers[job.type] = Math.max(0, this.activeWorkers[job.type] - 1);
    this.metrics.totalProcessed++;
    
    const processingTime = job.completedAt - (job.startedAt || job.createdAt);
    this.metrics.totalProcessingTime += processingTime;
    
    logger.info(`[MediaQueue] Completed job ${jobId} in ${processingTime}ms`);
  }

  /**
   * Mark job as failed
   */
  failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.errorMessage = error;
    job.completedAt = Date.now();
    job.updatedAt = Date.now();
    
    this.activeWorkers[job.type] = Math.max(0, this.activeWorkers[job.type] - 1);
    this.metrics.totalFailed++;
    
    logger.warn(`[MediaQueue] Failed job ${jobId}: ${error}`);
  }

  /**
   * Cancel a queued job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'queued') return false;

    job.status = 'cancelled';
    job.updatedAt = Date.now();
    
    // Remove from priority queue
    const queue = this.priorityQueues[job.priority];
    const index = queue.findIndex(j => j.id === jobId);
    if (index !== -1) {
      queue.splice(index, 1);
    }
    
    logger.info(`[MediaQueue] Cancelled job ${jobId}`);
    return true;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): MediaJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a user
   */
  getUserJobs(userId: string, limit = 20): MediaJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Get queue metrics
   */
  getMetrics(): QueueMetrics {
    const allJobs = Array.from(this.jobs.values());
    const activeJobs = allJobs.filter(j => j.status === 'processing').length;
    const queuedJobs = allJobs.filter(j => j.status === 'queued').length;
    const failedJobs = allJobs.filter(j => j.status === 'failed').length;
    
    const avgWaitTime = this.metrics.totalProcessed > 0 
      ? this.metrics.totalProcessingTime / this.metrics.totalProcessed 
      : 0;
    
    return {
      totalJobs: allJobs.length,
      activeJobs,
      queuedJobs,
      failedJobs,
      avgWaitTime,
      avgProcessingTime: avgWaitTime,
    };
  }

  /**
   * Dynamically scale workers based on load and API health
   */
  scaleWorkers(apiHealthScore: number, currentLoad: number): void {
    // Scale up when API is healthy and load is high
    if (apiHealthScore > 0.9 && currentLoad > 10) {
      this.maxWorkers.image = Math.min(8, this.maxWorkers.image + 1);
      this.maxWorkers.video = Math.min(3, this.maxWorkers.video + 1);
      logger.info(`[MediaQueue] Scaled up workers: image=${this.maxWorkers.image}, video=${this.maxWorkers.video}`);
    } 
    // Scale down when API is struggling
    else if (apiHealthScore < 0.7) {
      this.maxWorkers.image = Math.max(2, this.maxWorkers.image - 1);
      this.maxWorkers.video = Math.max(1, this.maxWorkers.video - 1);
      logger.info(`[MediaQueue] Scaled down workers: image=${this.maxWorkers.image}, video=${this.maxWorkers.video}`);
    }
  }

  /**
   * Garbage collect old completed jobs (> 1 hour)
   */
  gc(): void {
    const cutoff = Date.now() - 3_600_000;
    let removed = 0;
    
    for (const [id, job] of this.jobs) {
      if (job.completedAt && job.completedAt < cutoff) {
        this.jobs.delete(id);
        
        // Remove from priority queue if still there
        const queue = this.priorityQueues[job.priority];
        const index = queue.findIndex(j => j.id === id);
        if (index !== -1) {
          queue.splice(index, 1);
        }
        
        removed++;
      }
    }
    
    if (removed > 0) {
      logger.info(`[MediaQueue] GC removed ${removed} old jobs`);
    }
  }

  /**
   * Get queue depth by priority
   */
  getQueueDepth(): Record<MediaPriority, { image: number; video: number }> {
    const depth: Record<MediaPriority, { image: number; video: number }> = {
      critical: { image: 0, video: 0 },
      high: { image: 0, video: 0 },
      normal: { image: 0, video: 0 },
      low: { image: 0, video: 0 },
    };
    
    for (const [priority, queue] of Object.entries(this.priorityQueues)) {
      for (const job of queue) {
        if (job.status === 'queued') {
          depth[priority as MediaPriority][job.type]++;
        }
      }
    }
    
    return depth;
  }
}

// Singleton instance
export const enterpriseMediaQueue = new EnterpriseMediaQueue();

// Run GC every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => enterpriseMediaQueue.gc(), 300_000);
}
