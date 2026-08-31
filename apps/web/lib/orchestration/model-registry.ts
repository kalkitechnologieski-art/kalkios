import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { ZhipuClient } from '@/lib/providers/zhipu/client';
import { OpenRouterClient } from '@/lib/providers/openrouter/client';

export interface ModelCapabilities {
  supportsStreaming: boolean;
  supportsThinking: boolean;
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsWebSearch: boolean;
}

export interface ModelProvider {
  name: string;
  client: any;
  defaultModel: string;
  weight: number;
  rpmLimit: number;
  isAvailable: () => boolean;
  capabilities: ModelCapabilities;
}

export class ModelRegistry {
  private providers: ModelProvider[] = [];

  constructor() {
    this.register({
      name: 'zhipu',
      client: new ZhipuClient(),
      defaultModel: 'glm-4.7',
      weight: 0.95,
      rpmLimit: 1,
      isAvailable: () => !!process.env.ZHIPU_API_KEY,
      capabilities: {
        supportsStreaming: true,
        supportsThinking: true,
        supportsImages: false,
        supportsVideo: false,
        supportsWebSearch: true,
      },
    });
    this.register({
      name: 'agnes',
      client: new AgnesClient(),
      defaultModel: 'agnes-2.5-flash',
      weight: 0.9,
      rpmLimit: 20,
      isAvailable: () => !!process.env.AGNES_API_KEY,
      capabilities: {
        supportsStreaming: true,
        supportsThinking: true,
        supportsImages: true,
        supportsVideo: true,
        supportsWebSearch: false,
      },
    });
    this.register({
      name: 'groq',
      client: new GroqClient(),
      defaultModel: 'llama-3.3-70b-versatile',
      weight: 0.85,
      rpmLimit: 30,
      isAvailable: () => !!process.env.GROQ_API_KEY,
      capabilities: {
        supportsStreaming: true,
        supportsThinking: false,
        supportsImages: false,
        supportsVideo: false,
        supportsWebSearch: false,
      },
    });
    this.register({
      name: 'openrouter',
      client: new OpenRouterClient(),
      defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
      weight: 0.6,
      rpmLimit: 20,
      isAvailable: () => !!process.env.OPENROUTER_API_KEY,
      capabilities: {
        supportsStreaming: true,
        supportsThinking: false,
        supportsImages: false,
        supportsVideo: false,
        supportsWebSearch: false,
      },
    });
  }

  private register(provider: ModelProvider) {
    this.providers.push(provider);
  }

  getAvailable(capability?: keyof ModelCapabilities): ModelProvider[] {
    return this.providers
      .filter(p => p.isAvailable())
      .filter(p => capability ? p.capabilities[capability] : true)
      .sort((a, b) => b.weight - a.weight);
  }

  getByName(name: string): ModelProvider | undefined {
    return this.providers.find(p => p.name === name);
  }

  getAll(): ModelProvider[] {
    return [...this.providers];
  }
}
