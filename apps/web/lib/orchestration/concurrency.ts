// == KALKI B6 HARDENING ==
// Concurrency primitives: semaphore, task pool, worker lane.
// Zero dependencies. Works in Node, Edge, and browser.
// -----------------------------------------------------------------------------

export interface SemaphoreOptions {
  /** Maximum concurrent tasks allowed. */
  maxConcurrency: number;
  /** Optional label for observability. */
  name?: string;
}

interface Waiter {
  resolve: () => void;
  reject: (err: unknown) => void;
  signal?: AbortSignal;
}

export class Semaphore {
  private readonly max: number;
  private readonly name: string;
  private active = 0;
  private queue: Waiter[] = [];

  constructor(opts: SemaphoreOptions) {
    this.max = Math.max(1, opts.maxConcurrency);
    this.name = opts.name ?? 'semaphore';
  }

  getStats(): { active: number; queued: number; max: number; name: string } {
    return { active: this.active, queued: this.queue.length, max: this.max, name: this.name };
  }

  async acquire(signal?: AbortSignal): Promise<() => void> {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    if (this.active < this.max) {
      this.active += 1;
      return this.makeReleaser();
    }

    return new Promise<() => void>((resolve, reject) => {
      const waiter: Waiter = { resolve: () => resolve(this.makeReleaser()), reject, signal };
      this.queue.push(waiter);
      if (signal) {
        signal.addEventListener('abort', () => {
          const idx = this.queue.indexOf(waiter);
          if (idx >= 0) {
            this.queue.splice(idx, 1);
            reject(new DOMException('Aborted', 'AbortError'));
          }
        }, { once: true });
      }
    });
  }

  private makeReleaser(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active = Math.max(0, this.active - 1);
      this.drain();
    };
  }

  private drain(): void {
    if (this.active >= this.max) return;
    const next = this.queue.shift();
    if (!next) return;
    if (next.signal?.aborted) {
      next.reject(new DOMException('Aborted', 'AbortError'));
      this.drain();
      return;
    }
    this.active += 1;
    next.resolve();
  }

  async run<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    const release = await this.acquire(signal);
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

/** Global semaphores per resource. Shared across all Siddhi invocations. */
export const CONCURRENCY = {
  device: new Semaphore({ maxConcurrency: 1, name: 'device' }),
  zhipu: new Semaphore({ maxConcurrency: 2, name: 'zhipu' }),
  groq: new Semaphore({ maxConcurrency: 6, name: 'groq' }),
  agnes: new Semaphore({ maxConcurrency: 6, name: 'agnes' }), // Increased from 4 for better throughput
  openrouter: new Semaphore({ maxConcurrency: 3, name: 'openrouter' }),
  image: new Semaphore({ maxConcurrency: 6, name: 'image' }), // Increased from 2 for concurrent image gen
  video: new Semaphore({ maxConcurrency: 2, name: 'video' }), // Increased from 1 to allow 2 concurrent videos
  search: new Semaphore({ maxConcurrency: 12, name: 'search' }),
  extraction: new Semaphore({ maxConcurrency: 8, name: 'extraction' }),
} as const;

export function concurrencySnapshot(): Record<string, ReturnType<Semaphore['getStats']>> {
  const out: Record<string, ReturnType<Semaphore['getStats']>> = {};
  for (const [k, s] of Object.entries(CONCURRENCY)) out[k] = s.getStats();
  return out;
}

/** Race a set of tasks; first to succeed wins. Others are aborted. */
export async function raceFirstSuccess<T>(
  tasks: Array<(signal: AbortSignal) => Promise<T>>,
  timeoutMs: number,
  outerSignal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('Race timeout')), timeoutMs);

  const onOuterAbort = () => controller.abort(new Error('Aborted'));
  if (outerSignal) outerSignal.addEventListener('abort', onOuterAbort, { once: true });

  try {
    return await new Promise<T>((resolve, reject) => {
      let failures = 0;
      const errors: unknown[] = [];
      if (tasks.length === 0) {
        reject(new Error('No tasks provided'));
        return;
      }
      for (const t of tasks) {
        Promise.resolve()
          .then(() => t(controller.signal))
          .then((value) => {
            controller.abort(new Error('Another task won'));
            resolve(value);
          })
          .catch((err) => {
            errors.push(err);
            failures += 1;
            if (failures === tasks.length) {
              reject(new AggregateError(errors, 'All tasks failed'));
            }
          });
      }
    });
  } finally {
    clearTimeout(timeout);
    if (outerSignal) outerSignal.removeEventListener('abort', onOuterAbort);
  }
}
