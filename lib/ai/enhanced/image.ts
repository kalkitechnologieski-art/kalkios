// lib/ai/enhanced/image.ts
import { ImageGenerationOptions, ImageGenerationResult } from './types';
import { imageCache } from './cache';
import { groqClient } from '@/lib/providers/groq/client';
import { agnesClient } from '@/lib/providers/agnes/client';
import { safeFileToBase64 } from './utils';

const QUALITY_CONFIGS = {
  low: { size: '1K' as const, steps: 10, model: 'agnes-image-2.1-flash' },
  standard: { size: '2K' as const, steps: 25, model: 'agnes-image-2.1-flash' },
  high: { size: '3K' as const, steps: 40, model: 'agnes-image-2.1-flash' },
  ultra: { size: '4K' as const, steps: 60, model: 'agnes-image-2.1-flash' },
};

export class EnhancedImageGenerator {
  private isServer = typeof window === 'undefined';

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const start = Date.now();
    const quality = options.quality || 'standard';
    const config = QUALITY_CONFIGS[quality];
    const size = options.size || config.size;
    const steps = options.steps || config.steps;

    // 1. Optimize prompt (only if short)
    const optimizedPrompt = options.prompt.length < 50 
      ? await this.optimizePrompt(options.prompt, options.style)
      : options.prompt;

    // 2. Check cache (client-side only)
    const cacheKey = this.getCacheKey(optimizedPrompt, size);
    if (options.cache !== false && !this.isServer) {
      const cached = imageCache.get(cacheKey);
      if (cached) {
        return {
          url: cached,
          provider: 'cache',
          size,
          ratio: options.ratio || '16:9',
          quality,
          steps,
          cache_hit: true,
          time_ms: Date.now() - start,
        };
      }
    }

    // 3. Prepare image data if provided
    let imageData: string | undefined;
    if (options.image) {
      if (typeof options.image === 'string') {
        imageData = options.image;
      } else if (!this.isServer) {
        imageData = await safeFileToBase64(options.image);
      } else {
        throw new Error('File upload is not supported on server');
      }
    }

    // 4. Call Agnes API
    const body: Record<string, unknown> = {
      model: config.model,
      prompt: optimizedPrompt,
      size,
      ratio: options.ratio || '16:9',
      n: options.n || 1,
    };

    const extraBody: Record<string, unknown> = {
      response_format: 'url',
    };

    if (options.negative_prompt) {
      extraBody.negative_prompt = options.negative_prompt;
    }
    if (steps) {
      extraBody.steps = steps;
    }
    if (imageData) {
      extraBody.image = [imageData];
    }

    if (Object.keys(extraBody).length > 0) {
      body.extra_body = extraBody;
    }

    const response = await agnesClient.image(body);
    const url = response.data?.[0]?.url;

    if (!url) {
      throw new Error('No image URL returned from Agnes');
    }

    // 5. Cache result
    if (options.cache !== false && !this.isServer) {
      imageCache.set(cacheKey, url);
    }

    return {
      url,
      provider: 'agnes',
      size,
      ratio: options.ratio || '16:9',
      quality,
      steps,
      cache_hit: false,
      time_ms: Date.now() - start,
    };
  }

  private async optimizePrompt(prompt: string, style?: string): Promise<string> {
    try {
      const styleInstruction = style ? ` in ${style} style` : '';
      const response = await groqClient.chat({
        messages: [{
          role: 'user',
          content: `Expand this short image prompt into a detailed, high-quality description${styleInstruction}. Be specific about lighting, composition, colors, and mood. Return only the expanded prompt, no explanation.\n\nOriginal: "${prompt}"`
        }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 200,
      });
      return response.choices?.[0]?.message?.content?.trim() || prompt;
    } catch {
      return prompt;
    }
  }

  private getCacheKey(prompt: string, size: string): string {
    const hash = this.hashString(prompt);
    return `image:${hash}:${size}`;
  }

  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
