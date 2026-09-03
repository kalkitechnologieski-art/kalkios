import { ImageGenerationOptions, ImageGenerationResult } from './types';
import { imageCache } from './cache';
import { GroqClient } from '@/lib/providers/groq/client';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { safeFileToBase64 } from './utils';

const QUALITY_CONFIGS = {
  low: { size: '1K', steps: 10, model: 'agnes-image-2.1-flash' },
  standard: { size: '2K', steps: 25, model: 'agnes-image-2.1-flash' },
  high: { size: '3K', steps: 40, model: 'agnes-image-2.1-flash' },
  ultra: { size: '4K', steps: 60, model: 'agnes-image-2.1-flash' },
};

export class EnhancedImageGenerator {
  private isServer = typeof window === 'undefined';
  private groq = new GroqClient();
  private agnes = new AgnesClient();

  async generate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    const start = Date.now();
    const quality = options.quality || 'standard';
    const config = QUALITY_CONFIGS[quality];
    const size = options.size || config.size;
    const steps = options.steps || config.steps;

    // Optimise prompt if short
    const optimizedPrompt = options.prompt.length < 50 
      ? await this.optimizePrompt(options.prompt, options.style)
      : options.prompt;

    // Check cache
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

    // Handle file upload
    let imageData: string | undefined;
    if (options.image) {
      if (typeof options.image === 'string') {
        imageData = options.image;
      } else if (!this.isServer) {
        imageData = await safeFileToBase64(options.image);
      } else {
        throw new Error('File upload not supported on server');
      }
    }

    // Build request
    const body: any = {
      model: config.model,
      prompt: optimizedPrompt,
      size,
      ratio: options.ratio || '16:9',
      n: options.n || 1,
    };
    const extraBody: any = { response_format: 'url' };
    if (options.negative_prompt) extraBody.negative_prompt = options.negative_prompt;
    if (steps) extraBody.steps = steps;
    if (imageData) extraBody.image = [imageData];
    if (Object.keys(extraBody).length) body.extra_body = extraBody;

    const response = await this.agnes.image(body);
    const url = response.data?.[0]?.url;
    if (!url) throw new Error('No image URL returned');

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
      const response = await this.groq.chat({
        messages: [{ role: 'user', content: `Expand this short image prompt into a detailed, high-quality description${styleInstruction}. Return only the expanded prompt:\n\n"${prompt}"` }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 200,
        stream: false,
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
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
