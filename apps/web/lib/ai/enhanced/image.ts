// lib/ai/enhanced/image.ts
import { ImageGenerationOptions, ImageGenerationResult } from './types';
import { imageCache } from './cache';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { imageQueue } from '@/lib/ai/queue';
import { logger } from '@/lib/utils/logger';

interface AnalyzedPrompt {
  original: string;
  enhanced: string;
  style: string;
  mood: string;
  subject: string;
  negative_prompt?: string;
  size: '1K' | '2K' | '3K' | '4K';
  ratio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9';
  quality: 'low' | 'standard' | 'high' | 'ultra';
  steps: number;
}

const QUALITY_CONFIGS = {
  low: { size: '1K' as const, steps: 10, model: 'agnes-image-2.1-flash' },
  standard: { size: '2K' as const, steps: 25, model: 'agnes-image-2.1-flash' },
  high: { size: '3K' as const, steps: 40, model: 'agnes-image-2.1-flash' },
  ultra: { size: '4K' as const, steps: 60, model: 'agnes-image-2.1-flash' },
};

export class EnhancedImageGenerator {
  private agnes: AgnesClient;
  private groq: GroqClient;
  private isServer: boolean;

  constructor() {
    this.agnes = new AgnesClient();
    this.groq = new GroqClient();
    this.isServer = typeof window === 'undefined';
  }

  /**
   * Analyze and enhance the prompt using Groq
   */
  private async analyzePrompt(prompt: string): Promise<AnalyzedPrompt> {
    const analysisPrompt = `Analyze this image generation prompt and extract structured data.
Return ONLY valid JSON with keys: style, mood, subject, negative_prompt (or null), enhanced_prompt (a detailed, expanded version of the prompt).

Original prompt: "${prompt}"`;

    try {
      const response = await this.groq.chat({
        messages: [{ role: 'user', content: analysisPrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 300,
        stream: false,
      });

      const content = response?.choices?.[0]?.message?.content || '{}';
      const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const analyzed = JSON.parse(clean);

      return {
        original: prompt,
        enhanced: analyzed.enhanced_prompt || prompt,
        style: analyzed.style || 'photorealistic',
        mood: analyzed.mood || 'neutral',
        subject: analyzed.subject || 'scene',
        negative_prompt: analyzed.negative_prompt || undefined,
        size: '2K',
        ratio: '16:9',
        quality: 'standard',
        steps: 25,
      };
    } catch (error) {
      logger.warn('[Image] Prompt analysis failed, using fallback:', error);
      return {
        original: prompt,
        enhanced: prompt,
        style: 'photorealistic',
        mood: 'neutral',
        subject: 'scene',
        negative_prompt: undefined,
        size: '2K',
        ratio: '16:9',
        quality: 'standard',
        steps: 25,
      };
    }
  }

  /**
   * Generate image with queue and caching
   */
  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const start = Date.now();

    // 1. Analyze prompt (unless already enhanced)
    const analyzed = await this.analyzePrompt(options.prompt);

    const quality = options.quality || analyzed.quality || 'standard';
    const config = QUALITY_CONFIGS[quality];
    const size = options.size || config.size;
    const steps = options.steps || config.steps;
    const ratio = options.ratio || '16:9';

    // 2. Check cache
    const cacheKey = this.getCacheKey(options.prompt, size, ratio);
    if (!this.isServer && options.cache !== false) {
      const cached = imageCache.get(cacheKey);
      if (cached) {
        return {
          url: cached,
          provider: 'cache',
          size,
          ratio,
          quality,
          steps,
          cache_hit: true,
          time_ms: Date.now() - start,
        };
      }
    }

    // 3. Queue the generation
    const finalPrompt = analyzed.enhanced;
    const negativePrompt = options.negative_prompt || analyzed.negative_prompt;

    const result = await imageQueue.enqueue({
      type: 'image',
      priority: options.priority || 'normal',
      maxRetries: 3,
      retries: 0,
      execute: async () => {
        const body: any = {
          model: config.model,
          prompt: finalPrompt,
          size: size,
          ratio: ratio,
          extra_body: {
            response_format: 'url',
          },
        };

        if (negativePrompt) {
          body.extra_body.negative_prompt = negativePrompt;
        }
        if (steps) {
          body.extra_body.steps = steps;
        }

        // Image-to-image: provide input image under extra_body.image
        // According to Agnes API docs: "image | string[] | For image-to-image | Input image array"[reference:4]
        if (options.image) {
          const imageData = typeof options.image === 'string'
            ? options.image
            : await this.fileToBase64(options.image);
          body.extra_body.image = [imageData];
        }

        const response = await this.agnes.image(body);
        const url = response.data?.[0]?.url;
        if (!url) throw new Error('No image URL returned');
        return url;
      },
    });

    // 4. Cache the result
    if (!this.isServer && options.cache !== false) {
      imageCache.set(cacheKey, result);
    }

    return {
      url: result,
      provider: 'agnes',
      size,
      ratio,
      quality,
      steps,
      cache_hit: false,
      time_ms: Date.now() - start,
    };
  }

  private async fileToBase64(file: File): Promise<string> {
    if (this.isServer) throw new Error('File upload not supported on server');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getCacheKey(prompt: string, size: string, ratio: string): string {
    const hash = this.hashString(prompt);
    return `image:${hash}:${size}:${ratio}`;
  }

  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
