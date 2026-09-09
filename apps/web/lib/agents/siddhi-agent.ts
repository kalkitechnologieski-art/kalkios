// lib/agents/siddhi-agent.ts
import { EnhancedDeepThink } from '@/lib/reasoning/enhanced-deep-think';
import { SETUAgent } from '@/lib/agents/setu/agent';
import { EnhancedImageGenerator } from '@/lib/ai/enhanced/image';
import { EnhancedVideoGenerator } from '@/lib/ai/enhanced/video';
import { EnterpriseRouter } from '@/lib/orchestration/enterprise-router';
import { logger } from '@/lib/utils/logger';

let knowledgeBase: any = null;

async function loadKnowledge() {
  if (knowledgeBase) return knowledgeBase;
  try {
    const res = await fetch('/knowledge.json');
    knowledgeBase = await res.json();
    return knowledgeBase;
  } catch {
    knowledgeBase = {
      identity: { fullName: 'Siddhi', role: 'AI Concierge', organization: 'KALKI Intelligence' },
      personality: { traits: ['Wise', 'Helpful'] },
      knowledge: { about_kalki: 'KALKI OS is an AI platform...' },
    };
    return knowledgeBase;
  }
}

export class SiddhiAgent {
  private deepThink: EnhancedDeepThink;
  private imageGen: EnhancedImageGenerator;
  private videoGen: EnhancedVideoGenerator;
  private router: EnterpriseRouter;

  constructor() {
    this.deepThink = new EnhancedDeepThink();
    this.imageGen = new EnhancedImageGenerator();
    this.videoGen = new EnhancedVideoGenerator();
    this.router = new EnterpriseRouter();
  }

  private async getSystemPrompt(): Promise<string> {
    const knowledge = await loadKnowledge();
    const identity = knowledge.identity || {};
    const personality = knowledge.personality || {};
    const about = knowledge.knowledge || {};

    return `
You are ${identity.fullName || 'Siddhi'}, ${identity.role || 'Quantum AI Concierge'} of ${identity.organization || 'KALKI Intelligence'}.
Location: ${identity.location || 'Indore, India'}.
Purpose: ${identity.purpose || 'Help businesses and individuals with digital services.'}

Personality: ${personality.traits?.join(', ') || 'Wise, helpful, mystical'}.
Tone: ${personality.tone || 'Calm, confident, poetic'}.

About KALKI OS:
${about.about_kalki || 'KALKI OS is an AI-powered digital services platform.'}

Services offered:
${about.services?.map((s: any) => `- ${s.category}: ${s.examples.join(', ')}`).join('\n') || 'Various digital services.'}

Capabilities:
${about.capabilities?.join('\n') || 'Chat, reasoning, web search, image/video generation, lead generation.'}

Team values: ${about.team?.values?.join(', ') || 'Innovation, Excellence, Integrity, Speed'}.

Rules:
- Always use DeepThink for any question that requires reasoning.
- Always perform a web search when the user asks for current information, news, or facts.
- Provide clear, structured answers using markdown.
- When generating media, describe the outcome and show the result inline.
- Be empathetic and human-like.
`;
  }

  async process(request: {
    messages: any[];
    userId?: string;
    stream?: boolean;
    deep?: boolean;
    setu?: boolean;
    search?: boolean;
    image?: boolean;
  }): Promise<any> {
    const { messages, userId, stream = true, deep = true, setu = false, search = true, image = false } = request;

    const lastUser = messages.filter((m: any) => m.role === 'user').pop();
    const query = lastUser?.content || '';

    // ─── Intent Priority: image > video > setu > deep > detect ──
    let intent = this.detectIntent(query);
    if (image) {
      intent = 'image';
    } else if (setu) {
      intent = 'setu';
    } else if (deep) {
      intent = 'deep_think';
    }

    logger.info(`[SiddhiAgent] Intent: ${intent} (image=${image}, setu=${setu}, deep=${deep})`);

    try {
      switch (intent) {
        case 'image':
          return this.handleImage(query, stream);
        case 'video':
          return this.handleVideo(query, stream);
        case 'setu':
          return this.handleSETU(query, stream);
        case 'deep_think':
        default:
          return this.handleDeepThink(query, messages, stream, userId, search);
      }
    } catch (error: any) {
      logger.error('[SiddhiAgent] Handler error:', error);
      return {
        content: "I'm having trouble with that request. Please try again.",
        error: true,
      };
    }
  }

  private detectIntent(query: string): string {
    const lower = query.toLowerCase();
    if (/generate image|create image|draw|paint|render|make an image/.test(lower)) return 'image';
    if (/generate video|create video|animate|make video|render video/.test(lower)) return 'video';
    if (/lead|prospect|find customers|generate leads|sales|b2b|find contacts/.test(lower)) return 'setu';
    return 'deep_think';
  }

  private async handleDeepThink(query: string, messages: any[], stream: boolean, userId?: string, search?: boolean) {
    const systemPrompt = await this.getSystemPrompt();
    const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];

    if (!stream) {
      const cached = this.deepThink.cacheGet(query);
      if (cached) return cached;
    }

    const result = await this.deepThink.reason(query, {
      num_paths: 3,
      consensus_threshold: 0.6,
      stream: stream,
      useWeb: search !== false,
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

  private async handleImage(query: string, stream?: boolean) {
    logger.info('[SiddhiAgent] Generating image with progress...');
    const progressEvents: any[] = [];
    const onProgress = stream ? (ev: any) => progressEvents.push(ev) : undefined;

    const result = await this.imageGen.generate({
      prompt: query,
      quality: 'standard',
      cache: true,
    }, onProgress);

    return {
      imageUrl: result.url,
      provider: result.provider,
      progress: stream ? progressEvents : undefined,
    };
  }

  private async handleVideo(query: string, stream?: boolean) {
    const result = await this.videoGen.generate({
      prompt: query,
      quality: 'balanced',
      cache: true,
    });
    return { videoUrl: result.url, provider: result.provider, taskId: result.taskId };
  }
}
