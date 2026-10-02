// ═══ SIDDHI v4.0 BATCH 2 ═══
// Unified provider contract. All provider clients implement `Provider`.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProviderRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  stream?: boolean;
}

export interface ProviderResult {
  content: string;
  reasoning?: string;
  tokens: { input: number; output: number; total: number };
  model: string;
  provider: string;
  finishReason: 'stop' | 'length' | 'error';
  latencyMs: number;
  cached: boolean;
}

export interface Provider {
  name: string;
  isHealthy(): Promise<boolean>;
  invoke(req: ProviderRequest): Promise<ProviderResult>;
  invokeStream(req: ProviderRequest): AsyncGenerator<string>;
}

export * from './agnes/client';
export * from './groq/client';
export * from './openrouter/client';
export * from './zhipu/client';
