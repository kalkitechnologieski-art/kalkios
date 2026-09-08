// lib/agents/siddhi-agent.ts
import { EnhancedDeepThink } from '@/lib/reasoning/enhanced-deep-think';
import { SETUAgent } from '@/lib/agents/setu/agent';
import { EnhancedImageGenerator } from '@/lib/ai/enhanced/image';
import { EnhancedVideoGenerator } from '@/lib/ai/enhanced/video';
import { EnterpriseRouter } from '@/lib/orchestration/enterprise-router';
import { SIDDHI_SYSTEM_PROMPT } from '@/lib/prompts/siddhi-system';
import { imageCache, videoCache } from '@/lib/ai/enhanced/cache';
import { logger } from '@/lib/utils/logger';

type Intent = 'chat' | 'deep_think' | 'setu' | 'image' | 'video';

export class SiddhiAgent {
  private router: EnterpriseRouter;
  private deepThink: EnhancedDeepThink;
  private imageGen: EnhancedImageGenerator;
  private videoGen: EnhancedVideoGenerator;

  constructor() {
    this.router = new EnterpriseRouter();
    this.deepThink = new EnhancedDeepThink();
    this.imageGen = new EnhancedImageGenerator();
    this.videoGen = new EnhancedVideoGenerator();
  }

  async process(request: {
    messages: any[];
    userId?: string;
    stream?: boolean;
    deep?: boolean;
    setu?: boolean;
    search?: boolean;
    image?: string;
  }): Promise<any> {
    const { messages, userId, stream = true, deep = true, setu = false, search = false, image } = request;

    const lastUser = messages.filter((m: any) => m.role === 'user').pop();
    const query = lastUser?.content || '';

    // Intent detection (with override for deep)
    let intent = this.detectIntent(query);

    // If deep flag is true, always use deep_think (override)
    if (deep) {
      intent = 'deep_think';
    }

    // If setu flag is true, override
    if (setu) {
      intent = 'setu';
    }

    // If image flag is provided, override
    if (image) {
      intent = 'image';
    }

    logger.info(`[SiddhiAgent] Intent: ${intent} (deep=${deep}, setu=${setu})`);

    try {
      switch (intent) {
        case 'deep_think':
          return this.handleDeepThink(query, messages, stream, userId);
        case 'setu':
          return this.handleSETU(query, stream);
        case 'image':
          return this.handleImage(query, image, stream);
        case 'video':
          return this.handleVideo(query, stream);
        default:
          // Chat always uses DeepThink (fallback)
          return this.handleDeepThink(query, messages, stream, userId);
      }
    } catch (error: any) {
      logger.error('[SiddhiAgent] Handler error:', error);
      return {
        content: "I'm having trouble with that request. Please try again later.",
        error: true,
      };
    }
  }

  private detectIntent(query: string): Intent {
    const lower = query.toLowerCase();
    if (/generate image|create image|draw|paint|render|make an image/.test(lower)) return 'image';
    if (/generate video|create video|animate|make video|render video/.test(lower)) return 'video';
    if (/lead|prospect|find customers|generate leads|sales|b2b|find contacts/.test(lower)) return 'setu';
    return 'deep_think'; // Default to DeepThink
  }

  private async handleDeepThink(query: string, messages: any[], stream: boolean, userId?: string) {
    if (!stream) {
      const cached = this.deepThink.cacheGet(query);
      if (cached) return cached;
    }
    const result = await this.deepThink.reason(query, {
      num_paths: 3,
      consensus_threshold: 0.6,
      stream: stream,
      useWeb: true,
    });
    return result;
  }

  private async handleSETU(query: string, stream: boolean) {
    const agent = new SETUAgent(query);
    const progressEvents: any[] = [];
    const onProgress = stream ? (ev: any) => progressEvents.push(ev) : undefined;
    await agent.executeSearch(onProgress);
    return {
      leads: agent.getLeads(),
      csv: agent.getCSV(),
      summary: agent.getSummary(),
      progress: stream ? progressEvents : undefined,
    };
  }

  private async handleImage(query: string, imageBase64?: string, stream?: boolean) {
    const cacheKey = `image:${query}`;
    const cachedUrl = imageCache.get(cacheKey);
    if (cachedUrl) return { imageUrl: cachedUrl, provider: 'cache' };

    const result = await this.imageGen.generate({
      prompt: query,
      image: imageBase64,
      quality: 'standard',
      cache: true,
    });
    return { imageUrl: result.url, provider: result.provider };
  }

  private async handleVideo(query: string, stream?: boolean) {
    const cacheKey = `video:${query}`;
    const cachedUrl = videoCache.get(cacheKey);
    if (cachedUrl) return { videoUrl: cachedUrl, provider: 'cache', taskId: 'cached' };

    const result = await this.videoGen.generate({
      prompt: query,
      quality: 'balanced',
      cache: true,
    });
    return { videoUrl: result.url, provider: result.provider, taskId: result.taskId };
  }
}
