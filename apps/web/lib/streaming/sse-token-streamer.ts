// apps/web/lib/streaming/sse-token-streamer.ts
// ─────────────────────────────────────────────────────────────────────────────
// Token-level SSE streaming with health tracking and structured errors
// Industry-grade implementation following ChatGPT/Claude patterns
// ─────────────────────────────────────────────────────────────────────────────

import { logger } from '@/lib/utils/logger';

export interface StreamEvent {
  type: 'token' | 'delta' | 'reasoning' | 'status' | 'trace' | 'error' | 'complete';
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface StreamHealthMetrics {
  tokensPerSecond: number;
  totalTokens: number;
  firstTokenLatencyMs: number;
  totalLatencyMs: number;
  errorCount: number;
}

export class TokenLevelStreamer {
  private encoder: TextEncoder;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private closed: boolean = false;
  private metrics: StreamHealthMetrics = {
    tokensPerSecond: 0,
    totalTokens: 0,
    firstTokenLatencyMs: 0,
    totalLatencyMs: 0,
    errorCount: 0,
  };
  private startTime: number = Date.now();
  private firstTokenTime: number = 0;

  constructor(writer: WritableStreamDefaultWriter<Uint8Array>) {
    this.encoder = new TextEncoder();
    this.writer = writer;
  }

  /**
   * Send a single token via SSE (optimal for real-time streaming)
   */
  async sendToken(token: string): Promise<void> {
    if (this.closed) return;

    const now = Date.now();
    if (this.firstTokenTime === 0) {
      this.metrics.firstTokenLatencyMs = now - this.startTime;
      this.firstTokenTime = now;
    }

    this.metrics.totalTokens += 1;
    const elapsed = (now - this.firstTokenTime) / 1000;
    this.metrics.tokensPerSecond = elapsed > 0 ? this.metrics.totalTokens / elapsed : 0;

    try {
      await this.writer.write(
        this.encoder.encode(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`)
      );
    } catch (error) {
      this.metrics.errorCount += 1;
      logger.warn('[SSE] Token write failed:', error);
      this.closed = true;
    }
  }

  /**
   * Send structured events (reasoning, status, traces)
   */
  async sendEvent(event: StreamEvent): Promise<void> {
    if (this.closed) return;

    try {
      await this.writer.write(
        this.encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
      );
    } catch (error) {
      this.metrics.errorCount += 1;
      logger.warn('[SSE] Event write failed:', error);
      this.closed = true;
    }
  }

  /**
   * Send error with classification (transient vs permanent)
   */
  async sendError(
    message: string,
    classification: 'transient' | 'permanent' | 'rate_limit' | 'timeout' | 'unknown',
    retryAfterSec?: number
  ): Promise<void> {
    await this.sendEvent({
      type: 'error',
      content: message,
      metadata: {
        classification,
        retryAfterSec,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Close stream gracefully and return final metrics
   */
  async close(): Promise<StreamHealthMetrics> {
    if (this.closed) return this.metrics;

    this.metrics.totalLatencyMs = Date.now() - this.startTime;

    // Send final metrics event
    await this.sendEvent({
      type: 'complete',
      metadata: {
        metrics: this.metrics,
      },
    });

    this.closed = true;
    try {
      await this.writer.close();
    } catch {
      // Already closed
    }

    return this.metrics;
  }

  /**
   * Check if stream is still open
   */
  isOpen(): boolean {
    return !this.closed;
  }

  /**
   * Get current health metrics snapshot
   */
  getMetrics(): StreamHealthMetrics {
    return { ...this.metrics };
  }
}

/**
 * Helper: Split text into tokens for streaming
 * Uses word-boundary aware splitting for natural flow
 */
export function splitIntoTokens(text: string): string[] {
  // Split on spaces but preserve punctuation attached to words
  const tokens: string[] = [];
  const words = text.split(/(\s+)/);

  for (const word of words) {
    if (word.trim().length === 0) {
      // Whitespace token
      if (word.length > 0) tokens.push(word);
    } else {
      // Word token - could be further split for very long words
      if (word.length > 50) {
        // Split long words into chunks
        for (let i = 0; i < word.length; i += 20) {
          tokens.push(word.slice(i, i + 20));
        }
      } else {
        tokens.push(word);
      }
    }
  }

  return tokens.filter((t) => t.length > 0);
}

/**
 * Helper: Simulate token streaming from a complete response
 * Useful for providers that don't support native token streaming
 */
export async function* simulateTokenStream(
  text: string,
  delayMs: number = 30
): AsyncGenerator<string> {
  const tokens = splitIntoTokens(text);

  for (const token of tokens) {
    yield token;
    // Add small random jitter to mimic natural typing
    const jitteredDelay = delayMs + Math.random() * 20;
    await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
  }
}
