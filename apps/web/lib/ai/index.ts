import { IntelligentRouter } from '@/lib/orchestration/router';
import { ChatMessage, ChatOptions, ChatResponse } from './types';
import { ensureString } from '@/lib/utils/string';

let routerInstance: IntelligentRouter | null = null;

function getRouter(): IntelligentRouter {
  if (!routerInstance) {
    routerInstance = new IntelligentRouter();
  }
  return routerInstance;
}

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions & { sessionId?: string } = {}
): Promise<ChatResponse> {
  const router = getRouter();
  const result = await router.route({
    messages,
    stream: options.stream || false,
    deep: options.deep || false,
    userId: options.sessionId,
    sessionId: options.sessionId,
  });

  if (result instanceof ReadableStream) {
    return {
      content: 'Streaming response (use /api/ai/stream for SSE)',
      tokens: 0,
      provider: 'stream',
    };
  }

  return {
    content: ensureString(result?.choices?.[0]?.message?.content || 'No response.'),
    reasoning: result?.choices?.[0]?.message?.reasoning_content,
    tokens: result?.usage?.total_tokens || 0,
    provider: result?.provider || 'unknown',
  };
}

// ─── Re-export from individual modules ──────────────────────────────────
export { generateImage, generateVideo } from './agnes';
export { webSearch, generateLeads } from './zhipu';

// ─── Re-export types ──────────────────────────────────────────────────────
export * from './types';

// ═══ SIDDHI v4.0 BATCH 3 — DEVICE ENGINE ═══
// WebGPU-native inference. Zero static imports of @mlc-ai/web-llm — the
// loader uses a Function-constructor to stay opaque to Turbopack, so the
// build succeeds even when the package is not installed.
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceTier = 'compact' | 'fast' | 'deep';
export type DeviceStatus = 'idle' | 'loading' | 'ready' | 'degraded' | 'failed' | 'unsupported';

export interface DeviceState {
  status: DeviceStatus;
  tier: DeviceTier | null;
  progress: number;
  progressText: string;
  gpuVendor: string | null;
  gpuArchitecture: string | null;
  vramMB: number;
  batterySaver: boolean;
  lastError: string | null;
}

interface WebLLMEngine {
  chat: {
    completions: {
      create(opts: {
        messages: Array<{ role: string; content: string }>;
        stream: true;
        temperature?: number;
        max_tokens?: number;
      }): Promise<AsyncIterable<{ choices?: Array<{ delta?: { content?: string } }> }>>;
    };
  };
  unload?: () => void;
}

interface WebLLMModule {
  CreateMLCEngine: (
    modelId: string,
    opts?: { initProgressCallback?: (report: { progress?: number; text?: string }) => void }
  ) => Promise<WebLLMEngine>;
}

interface TierSpec {
  id: string;
  sizeMB: number;
  vramFloorMB: number;
  contextWindow: number;
}

const TIER_SPECS: Record<DeviceTier, TierSpec> = {
  compact: { id: 'Qwen3-0.6B-q4f16_1-MLC',  sizeMB: 500,  vramFloorMB: 4_000,  contextWindow: 32_768 },
  fast:    { id: 'Qwen3-1.7B-q4f16_1-MLC',  sizeMB: 1_100, vramFloorMB: 8_000,  contextWindow: 32_768 },
  deep:    { id: 'Qwen3-4B-q4f16_1-MLC',    sizeMB: 2_200, vramFloorMB: 16_000, contextWindow: 32_768 },
};

const deviceState: DeviceState = {
  status: 'idle',
  tier: null,
  progress: 0,
  progressText: '',
  gpuVendor: null,
  gpuArchitecture: null,
  vramMB: 0,
  batterySaver: false,
  lastError: null,
};

let deviceEngine: WebLLMEngine | null = null;
let deviceModule: WebLLMModule | null = null;
let deviceModuleTried = false;

async function loadWebLLMModule(): Promise<WebLLMModule | null> {
  if (deviceModuleTried) return deviceModule;
  deviceModuleTried = true;

  if (typeof window === 'undefined') return null;

  try {
    // Function constructor hides the module ID from static analyzers.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const loader = new Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
    const mod = await loader('@mlc-ai/web-llm');
    if (mod && typeof (mod as WebLLMModule).CreateMLCEngine === 'function') {
      deviceModule = mod as WebLLMModule;
      return deviceModule;
    }
  } catch {
    // Package not installed or runtime restriction
  }
  return null;
}

async function detectBatterySaver(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  try {
    const nav = navigator as unknown as {
      getBattery?: () => Promise<{ charging?: boolean; level?: number }>;
    };
    if (typeof nav.getBattery !== 'function') return false;
    const battery = await nav.getBattery();
    return battery.charging === false && (battery.level ?? 1) < 0.2;
  } catch {
    return false;
  }
}

export async function probeDevice(): Promise<{ capable: boolean; tier: DeviceTier; reason?: string }> {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    deviceState.status = 'unsupported';
    return { capable: false, tier: 'compact', reason: 'ssr' };
  }

  const nav = navigator as unknown as {
    gpu?: { requestAdapter(opts?: { powerPreference?: string }): Promise<unknown> };
  };
  if (!nav.gpu) {
    deviceState.status = 'unsupported';
    return { capable: false, tier: 'compact', reason: 'no-webgpu' };
  }

  try {
    const adapter = await nav.gpu.requestAdapter({ powerPreference: 'high-performance' }) as {
      info?: { vendor?: string; architecture?: string };
      limits?: { maxBufferSize?: number; maxStorageBufferBindingSize?: number };
    } | null;
    if (!adapter) {
      deviceState.status = 'unsupported';
      return { capable: false, tier: 'compact', reason: 'no-adapter' };
    }

    const maxBuffer = adapter.limits?.maxBufferSize ?? 0;
    const maxStorage = adapter.limits?.maxStorageBufferBindingSize ?? 0;
    const vramEstimateMB = Math.min(maxBuffer, maxStorage) / (1024 * 1024);

    deviceState.gpuVendor = adapter.info?.vendor ?? 'unknown';
    deviceState.gpuArchitecture = adapter.info?.architecture ?? 'unknown';
    deviceState.vramMB = vramEstimateMB;

    const batterySaver = await detectBatterySaver();
    deviceState.batterySaver = batterySaver;

    let tier: DeviceTier = 'compact';
    if (vramEstimateMB >= 8_000 && !batterySaver) tier = 'deep';
    else if (vramEstimateMB >= 4_000) tier = 'fast';

    return { capable: true, tier };
  } catch {
    deviceState.status = 'unsupported';
    return { capable: false, tier: 'compact', reason: 'probe-failed' };
  }
}

export async function ensureDeviceEngine(
  preferredTier: DeviceTier,
  onProgress?: (progress: number, text: string) => void
): Promise<boolean> {
  if (deviceState.status === 'ready' && deviceEngine && deviceState.tier === preferredTier) {
    return true;
  }

  const mod = await loadWebLLMModule();
  if (!mod) {
    deviceState.status = 'unsupported';
    deviceState.lastError = 'WebLLM library not installed';
    return false;
  }

  const cascade: DeviceTier[] = preferredTier === 'deep'
    ? ['deep', 'fast', 'compact']
    : preferredTier === 'fast'
      ? ['fast', 'compact']
      : ['compact'];

  deviceState.status = 'loading';

  for (const tier of cascade) {
    const spec = TIER_SPECS[tier];
    if (deviceState.vramMB > 0 && spec.vramFloorMB > deviceState.vramMB * 1.5) continue;

    try {
      const engine = await mod.CreateMLCEngine(spec.id, {
        initProgressCallback: (report) => {
          deviceState.progress = report.progress ?? 0;
          deviceState.progressText = report.text ?? '';
          onProgress?.(deviceState.progress, deviceState.progressText);
        },
      });
      deviceEngine = engine;
      deviceState.tier = tier;
      deviceState.status = 'ready';
      deviceState.progress = 1;
      deviceState.progressText = 'Ready';
      return true;
    } catch (error) {
      deviceState.lastError = String(error).slice(0, 200);
      // try next tier
    }
  }

  deviceState.status = 'failed';
  return false;
}

export function isDeviceReady(): boolean {
  return deviceState.status === 'ready' && deviceEngine !== null;
}

export function getDeviceState(): DeviceState {
  return { ...deviceState };
}

export function unloadDeviceEngine(): void {
  try { deviceEngine?.unload?.(); } catch { /* ignore */ }
  deviceEngine = null;
  deviceState.status = 'idle';
  deviceState.tier = null;
  deviceState.progress = 0;
}

export async function* streamDeviceInference(
  messages: Array<{ role: string; content: string }>,
  options: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {}
): AsyncGenerator<string> {
  if (!deviceEngine) throw new Error('Device engine not ready');

  const stream = await deviceEngine.chat.completions.create({
    messages,
    stream: true,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  });

  let lastTokenAt = Date.now();
  for await (const chunk of stream) {
    if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (Date.now() - lastTokenAt > 20_000) throw new Error('Device inference stalled');
    lastTokenAt = Date.now();
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) yield delta;
  }
}
// ═══ SIDDHI v4.0 BATCH 3 — END DEVICE ENGINE ═══
