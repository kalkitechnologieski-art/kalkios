/**
 * SIDDHI v4.0 — Distributed AI Orchestrator
 * 
 * Coordinates inference across:
 * 1. Local browser nodes (opt-in WebLLM)
 * 2. Cloud fallbacks (Groq → Agnes → Zhipu → OpenRouter)
 * 3. Peer compute pool (anonymous visitor devices)
 */

import { ChatMessage } from './types';
import { DeviceTier, getDeviceState, ensureDeviceEngine, streamDeviceInference, probeDevice } from './index';
import { chat as cloudChat } from './index';

export interface NodeCapability {
  nodeId: string;
  tier: DeviceTier | 'cloud';
  vramMB: number;
  status: 'idle' | 'busy' | 'offline';
  latencyMs: number;
}

export interface OrchestrationConfig {
  useLocalFirst: boolean;
  usePeerPool: boolean;
  cloudFallbackOrder: Array<'groq' | 'agnes' | 'zhipu' | 'openrouter'>;
  maxParallelNodes: number;
  consensusThreshold: number; // 0-1, how many nodes must agree
}

const DEFAULT_CONFIG: OrchestrationConfig = {
  useLocalFirst: true,
  usePeerPool: false, // Privacy-first: disabled by default
  cloudFallbackOrder: ['groq', 'agnes', 'zhipu', 'openrouter'],
  maxParallelNodes: 3,
  consensusThreshold: 0.7,
};

class DistributedOrchestrator {
  private config: OrchestrationConfig;
  private localNodeReady = false;
  private peerNodes: Map<string, NodeCapability> = new Map();
  private activeSessions: Map<string, AbortController> = new Map();

  constructor(config: Partial<OrchestrationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize local node with opt-in consent
   */
  async initializeLocalNode(
    preferredTier: DeviceTier = 'fast',
    onProgress?: (progress: number, text: string) => void
  ): Promise<boolean> {
    const probe = await probeDevice();
    if (!probe.capable) {
      console.log('[Siddhi] Device not capable of local inference');
      return false;
    }

    const ready = await ensureDeviceEngine(preferredTier, onProgress);
    this.localNodeReady = ready;
    
    if (ready) {
      const state = getDeviceState();
      console.log(`[Siddhi] Local node ready: ${state.tier} tier, ${state.vramMB}MB VRAM`);
    }
    
    return ready;
  }

  /**
   * Register a peer node in the distributed pool
   */
  registerPeerNode(nodeId: string, capability: Omit<NodeCapability, 'status' | 'latencyMs'>): void {
    this.peerNodes.set(nodeId, {
      ...capability,
      status: 'idle',
      latencyMs: 0,
    });
  }

  /**
   * Remove a peer node
   */
  unregisterPeerNode(nodeId: string): void {
    this.peerNodes.delete(nodeId);
  }

  /**
   * Main inference method with tiered fallback
   */
  async *streamWithFallback(
    messages: ChatMessage[],
    options: {
      sessionId?: string;
      temperature?: number;
      maxTokens?: number;
      signal?: AbortSignal;
      onProviderChange?: (provider: string) => void;
    } = {}
  ): AsyncGenerator<{ content: string; provider: string; metadata?: Record<string, unknown> }> {
    const abortController = new AbortController();
    if (options.signal) {
      options.signal.addEventListener('abort', () => abortController.abort());
    }
    if (options.sessionId) {
      this.activeSessions.set(options.sessionId, abortController);
    }

    try {
      // Tier 1: Local browser inference (if opted in and ready)
      if (this.config.useLocalFirst && this.localNodeReady) {
        try {
          yield* this.streamLocal(messages, options);
          return;
        } catch (err) {
          console.warn('[Siddhi] Local inference failed, falling back to cloud:', err);
        }
      }

      // Tier 2: Peer pool (if enabled)
      if (this.config.usePeerPool && this.peerNodes.size > 0) {
        try {
          yield* this.streamPeerPool(messages, options);
          return;
        } catch (err) {
          console.warn('[Siddhi] Peer pool failed, falling back to cloud:', err);
        }
      }

      // Tier 3: Cloud fallbacks
      for (const provider of this.config.cloudFallbackOrder) {
        try {
          options.onProviderChange?.(provider);
          yield* this.streamCloud(provider, messages, options);
          return;
        } catch (err) {
          console.warn(`[Siddhi] Cloud provider ${provider} failed:`, err);
        }
      }

      throw new Error('All inference providers exhausted');
    } finally {
      if (options.sessionId) {
        this.activeSessions.delete(options.sessionId);
      }
    }
  }

  /**
   * Stream from local WebLLM engine
   */
  private async *streamLocal(
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
  ): AsyncGenerator<{ content: string; provider: string }> {
    const state = getDeviceState();
    if (!state || state.status !== 'ready') {
      throw new Error('Local engine not ready');
    }

    let fullContent = '';
    for await (const token of streamDeviceInference(
      messages.map(m => ({ role: m.role, content: m.content })),
      {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        signal: options.signal,
      }
    )) {
      fullContent += token;
      yield { content: token, provider: `local-${state.tier}` };
    }
  }

  /**
   * Stream from peer pool with consensus
   */
  private async *streamPeerPool(
    messages: ChatMessage[],
    options: { temperature?: number; signal?: AbortSignal }
  ): AsyncGenerator<{ content: string; provider: string }> {
    const availableNodes = Array.from(this.peerNodes.values())
      .filter(n => n.status === 'idle')
      .slice(0, this.config.maxParallelNodes);

    if (availableNodes.length === 0) {
      throw new Error('No peer nodes available');
    }

    // In production, this would broadcast to peers via WebSocket
    // For now, we simulate by using cloud fallback
    throw new Error('Peer pool not yet implemented');
  }

  /**
   * Stream from cloud provider
   */
  private async *streamCloud(
    provider: string,
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
  ): AsyncGenerator<{ content: string; provider: string }> {
    const response = await cloudChat(messages, {
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    yield {
      content: response.content,
      provider: response.provider || provider,
    };
  }

  /**
   * Cancel an active session
   */
  cancelSession(sessionId: string): void {
    const controller = this.activeSessions.get(sessionId);
    if (controller) {
      controller.abort();
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      localNode: {
        ready: this.localNodeReady,
        state: getDeviceState(),
      },
      peerNodes: {
        total: this.peerNodes.size,
        idle: Array.from(this.peerNodes.values()).filter(n => n.status === 'idle').length,
      },
      activeSessions: this.activeSessions.size,
    };
  }
}

// Singleton instance
let orchestratorInstance: DistributedOrchestrator | null = null;

export function getOrchestrator(config?: Partial<OrchestrationConfig>): DistributedOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new DistributedOrchestrator(config);
  }
  return orchestratorInstance;
}

export { DistributedOrchestrator };
