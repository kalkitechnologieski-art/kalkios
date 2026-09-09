// lib/ai/enhanced/image.ts
import { ImageGenerationOptions, ImageGenerationResult } from './types';
import { imageCache } from './cache';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { imageQueue } from '@/lib/ai/queue';
import { logger } from '@/lib/utils/logger';

const GROQ_MODEL = 'llama-3.1-70b-versatile';

export interface ImageProgressEvent {
  type: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  taskId?: string;
}

export class EnhancedImageGenerator {
  private agnes: AgnesClient;
  private groq: GroqClient;
  private isServer: boolean;

  constructor() {
    this.agnes = new AgnesClient();
    this.groq = new GroqClient();
    this.isServer = typeof window === 'undefined';
  }

  private async analyzePrompt(prompt: string): Promise<string> {
    try {
      const response = await this.groq.chat({
        messages: [{
          role: 'user',
          content: `Expand this short image prompt into a detailed, high-quality description. Include lighting, composition, colors, and mood. Return only the expanded prompt:\n\n"${prompt}"`
        }],
        model: GROQ_MODEL,
        temperature: 0.5,
        max_tokens: 200,
        stream: false,
      });
      return response?.choices?.[0]?.message?.content?.trim() || prompt;
    } catch {
      return prompt;
    }
  }

  async generate(
    options: ImageGenerationOptions,
    onProgress?: (event: ImageProgressEvent) => void
  ): Promise<ImageGenerationResult> {
    const start = Date.now();
    const size = options.size || '2K';
    const ratio = options.ratio || '16:9';
    const quality = options.quality || 'standard';

    onProgress?.({ type: 'processing', progress: 10, message: 'Analyzing prompt...' });
    const enhancedPrompt = options._analyzed ? options.prompt : await this.analyzePrompt(options.prompt);
    onProgress?.({ type: 'processing', progress: 25, message: 'Prompt enhanced successfully' });

    const cacheKey = this.getCacheKey(options.prompt, size, ratio);
    if (!this.isServer && options.cache !== false) {
      const cached = imageCache.get(cacheKey);
      if (cached) {
        onProgress?.({ type: 'completed', progress: 100, message: '✅ From cache!' });
        return {
          url: cached,
          provider: 'cache',
          size,
          ratio,
          quality,
          steps: options.steps || 25,
          cache_hit: true,
          time_ms: Date.now() - start,
        };
      }
    }

    onProgress?.({ type: 'processing', progress: 30, message: 'Queuing generation...' });

    const result = await imageQueue.enqueue({
      type: 'image',
      priority: options.priority || 'normal',
      maxRetries: 3,
      retries: 0,
      execute: async () => {
        onProgress?.({ type: 'processing', progress: 50, message: 'Generating image...' });
        const body: any = {
          model: 'agnes-image-2.1-flash',
          prompt: enhancedPrompt,
          size: size,
          ratio: ratio,
          extra_body: { response_format: 'url' },
        };
        if (options.negative_prompt) body.extra_body.negative_prompt = options.negative_prompt;
        if (options.steps) body.extra_body.steps = options.steps;
        if (options.image) {
          const imageData = typeof options.image === 'string' ? options.image : await this.fileToBase64(options.image);
          body.extra_body.image = [imageData];
        }

        // Simulate progress (Agnes doesn't have progress endpoint for images)
        let progress = 60;
        const interval = setInterval(() => {
          progress += 5;
          if (progress < 95) {
            onProgress?.({ type: 'processing', progress, message: `Generating... ${progress}%` });
            imageQueue.updateProgress('image', progress);
          }
        }, 500);

        try {
          const response = await this.agnes.image(body);
          clearInterval(interval);
          const url = response.data?.[0]?.url;
          if (!url) throw new Error('No image URL returned');
          onProgress?.({ type: 'processing', progress: 95, message: '✨ Refining...' });
          return url;
        } catch (error) {
          clearInterval(interval);
          throw error;
        }
      },
    });

    onProgress?.({ type: 'completed', progress: 100, message: '✅ Done!' });

    if (!this.isServer && options.cache !== false) {
      imageCache.set(cacheKey, result);
    }

    return {
      url: result,
      provider: 'agnes',
      size,
      ratio,
      quality,
      steps: options.steps || 25,
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
