// ═══ SIDDHI v4.0 BATCH 1 ═══
// Token-budget-aware context manager with auto-compression.
// ─────────────────────────────────────────────────────────────────────────────

import type { ChatMessage } from './types';

export interface FileAttachment {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'txt';
  name: string;
  size: number;
  dataUrl: string;
  extractedText?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationState {
  id: string;
  messages: ChatMessage[];
  intent: string;
  mode: 'chat' | 'image' | 'video' | 'search' | 'lead';
  attachments: FileAttachment[];
  currentStep: number;
  totalSteps: number;
  metadata: Record<string, unknown>;
}

export class ContextManager {
  private state: ConversationState;
  private static instance: ContextManager | null = null;
  private readonly MAX_TOKENS = 12_000;
  private tokenUsage = 0;

  static getInstance(): ContextManager {
    if (!ContextManager.instance) ContextManager.instance = new ContextManager();
    return ContextManager.instance;
  }

  constructor() { this.state = this.blank(); }

  private blank(): ConversationState {
    return {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
      messages: [],
      intent: 'chat',
      mode: 'chat',
      attachments: [],
      currentStep: 0,
      totalSteps: 0,
      metadata: {},
    };
  }

  private estimate(text: string): number { return Math.ceil(text.length / 4); }

  getTokenBudget(): { used: number; remaining: number; percent: number } {
    return {
      used: this.tokenUsage,
      remaining: this.MAX_TOKENS - this.tokenUsage,
      percent: (this.tokenUsage / this.MAX_TOKENS) * 100,
    };
  }

  shouldSummarize(): boolean { return this.tokenUsage > this.MAX_TOKENS * 0.8; }

  update(message: ChatMessage, attachments: FileAttachment[] = []): void {
    this.state.messages.push(message);
    this.tokenUsage += this.estimate(message.content ?? '');
    if (attachments.length > 0) this.state.attachments = attachments;
    this.state.intent = this.detectIntent(message.content ?? '');
    this.state.mode = this.detectMode(message.content ?? '');
    this.state.currentStep += 1;
    this.state.totalSteps += 1;
    if (this.shouldSummarize()) this.compress();
  }

  getContext(): string {
    return [
      '## Conversation State',
      `- Mode: ${this.state.mode}`,
      `- Intent: ${this.state.intent}`,
      `- Total Messages: ${this.state.messages.length}`,
      `- Attachments: ${this.state.attachments.length}`,
      `- Token Usage: ${this.tokenUsage}/${this.MAX_TOKENS}`,
      '',
      '## Recent Messages',
      ...this.state.messages.slice(-5).map((m) => `${m.role}: ${(m.content ?? '').slice(0, 100)}`),
    ].join('\n');
  }

  getState(): ConversationState { return { ...this.state }; }

  private detectIntent(content: string): string {
    const lower = content.toLowerCase();
    if (lower.includes('generate image') || lower.includes('create image')) return 'image';
    if (lower.includes('generate video') || lower.includes('create video')) return 'video';
    if (lower.includes('search') || lower.includes('find')) return 'search';
    if (lower.includes('lead') || lower.includes('prospect')) return 'lead';
    return 'chat';
  }

  private detectMode(content: string): ConversationState['mode'] {
    const lower = content.toLowerCase();
    if (lower.includes('image')) return 'image';
    if (lower.includes('video')) return 'video';
    if (lower.includes('search')) return 'search';
    if (lower.includes('lead')) return 'lead';
    return 'chat';
  }

  private compress(): void {
    const keep = this.state.messages.slice(-10);
    this.tokenUsage = keep.reduce((s, m) => s + this.estimate(m.content ?? ''), 0);
    this.state.messages = keep;
  }

  reset(): void { this.state = this.blank(); this.tokenUsage = 0; }
}
