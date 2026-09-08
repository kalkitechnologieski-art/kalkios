// lib/agents/siddhi-agent.ts
// ──────────────────────────────────────────────────────────────────
// FIXED: Handler signatures now all accept (query, messages, stream, userId)
// ──────────────────────────────────────────────────────────────────

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
  }): Promise<any> {
    const { messages, userId, stream = true } = request;
    const lastUser = messages.filter((m: any) => m.role === 'user').pop();
    const query = lastUser?.content || '';

    const intent = await this.detectIntent(query);
    logger.info(`[SiddhiAgent] Intent: ${intent}`);

    try {
      const handler = this.getHandler(intent);
      return await handler(query, messages, stream, userId);
    } catch (error) {
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
    if (/explain|analyze|why|how|what if|compare|detail|thorough|comprehensive/.test(lower) || query.length > 80) {
      return 'deep_think';
    }
    return 'chat';
  }

  private getHandler(intent: Intent):
    (query: string, messages: any[], stream: boolean, userId?: string) => Promise<any> {
    switch (intent) {
      case 'deep_think': return this.handleDeepThink.bind(this);
      case 'setu': return this.handleSETU.bind(this);
      case 'image': return this.handleImage.bind(this);
      case 'video': return this.handleVideo.bind(this);
      default: return this.handleChat.bind(this);
    }
  }

  // ---- Handlers (all accept query, messages, stream, userId) ----

  private async handleDeepThink(
    query: string,
    messages: any[],
    stream: boolean,
    userId?: string
  ) {
    if (!stream) {
      const cached = this.deepThink.cacheGet(query);
      if (cached) return cached;
    }
    const result = await this.deepThink.reason(query, {
      num_paths: 3,
      consensus_threshold: 0.6,
      stream,
      useWeb: true,
    });
    return result;
  }

  private async handleSETU(
    query: string,
    _messages: any[],
    stream: boolean,
    _userId?: string
  ) {
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

  private async handleImage(
    query: string,
    _messages: any[],
    _stream: boolean,
    _userId?: string
  ) {
    const cacheKey = `image:${query}`;
    const cachedUrl = imageCache.get(cacheKey);
    if (cachedUrl) return { imageUrl: cachedUrl, provider: 'cache' };

    const result = await this.imageGen.generate({
      prompt: query,
      quality: 'standard',
      cache: true,
    });
    return { imageUrl: result.url, provider: result.provider };
  }

  private async handleVideo(
    query: string,
    _messages: any[],
    _stream: boolean,
    _userId?: string
  ) {
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

  private async handleChat(
    query: string,          // unused, kept for signature consistency
    messages: any[],
    stream: boolean,
    userId?: string
  ) {
    const systemMessage = { role: 'system', content: SIDDHI_SYSTEM_PROMPT };
    const allMessages = [systemMessage, ...messages];
    return this.router.route({
      messages: allMessages,
      stream,
      userId,
    });
  }
}
