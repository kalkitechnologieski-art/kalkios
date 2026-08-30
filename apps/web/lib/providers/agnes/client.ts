import { z } from "zod";

const AGNES_BASE = "https://apihub.agnes-ai.com/v1";

// ---- Chat Schema ----
export const AgnesChatRequestSchema = z.object({
  model: z.enum(["agnes-2.0-flash", "agnes-2.5-flash", "agnes-2.5-pro"]).default("agnes-2.0-flash"),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "tool"]),
      content: z.string(),
    })
  ),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().positive().default(4096),
  stream: z.boolean().default(false),
  tools: z.array(z.any()).optional(),
  tool_choice: z.union([z.enum(["auto", "none"]), z.object({ type: z.literal("function"), function: z.object({ name: z.string() }) })]).optional(),
  thinking: z.object({
    type: z.enum(["enabled", "disabled"]),
    budget_tokens: z.number().optional(),
  }).optional(),
});

export type AgnesChatRequest = z.infer<typeof AgnesChatRequestSchema>;

// ---- Image Generation Schema ----
export const AgnesImageRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.enum(["agnes-image-2.0-flash", "agnes-image-2.1-flash"]).default("agnes-image-2.1-flash"),
  size: z.enum(["1K", "2K", "3K", "4K"]).default("2K"),
  ratio: z.enum(["1:1", "3:4", "4:3", "16:9", "9:16", "2:3", "3:2", "21:9"]).default("16:9"),
  image: z.string().url().or(z.string().startsWith("data:image/")).optional(),
  negative_prompt: z.string().optional(),
  steps: z.number().int().min(1).max(100).optional(),
  n: z.number().int().min(1).max(4).default(1),
  return_base64: z.boolean().default(false),
  response_format: z.enum(["url", "b64_json"]).default("url"),
});

export type AgnesImageRequest = z.infer<typeof AgnesImageRequestSchema>;

// ---- Video Generation Schema ----
export const AgnesVideoRequestSchema = z.object({
  prompt: z.string().min(1),
  model: z.enum(["agnes-video-v2.0", "agnes-video-2.5", "agnes-video-2.5-flash"]).default("agnes-video-2.5-flash"),
  mode: z.enum(["text", "keyframe", "reference"]).default("text"),
  seconds: z.enum(["4", "5", "6", "7", "8", "9", "10", "11", "12"]).default("5"),
  size: z.enum(["720P", "960P", "2K"]).default("720P"),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]).default("16:9"),
  seed: z.number().int().optional(),
  first_frame: z.string().url().optional(),
  last_frame: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  audios: z.array(z.string().url()).optional(),
  videos: z.array(
    z.object({
      url: z.string().url(),
      start_seconds: z.number().optional(),
      require_audio: z.boolean().optional(),
    })
  ).optional(),
  n: z.number().int().default(1),
});

export type AgnesVideoRequest = z.infer<typeof AgnesVideoRequestSchema>;

// ---- Client ----
export class AgnesClient {
  private apiKey: string;
  private baseUrl: string;
  private rpm: number;
  private requests: number[] = [];

  constructor() {
    const key = process.env.AGNES_API_KEY;
    if (!key) throw new Error("AGNES_API_KEY not set");
    this.apiKey = key;
    this.baseUrl = AGNES_BASE;
    this.rpm = 20; // Free tier RPM
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < 60000);
    if (this.requests.length >= this.rpm) {
      const oldest = this.requests[0] || 0;
      const wait = 60000 - (now - oldest);
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait + 100));
      }
    }
    this.requests.push(now);
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout = 60000
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  // --- Chat ---
  async chat(request: AgnesChatRequest): Promise<any> {
    await this.waitForRateLimit();
    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Agnes chat error ${response.status}: ${text}`);
    }
    return response.json();
  }

  async chatStream(request: AgnesChatRequest): Promise<ReadableStream | null> {
    await this.waitForRateLimit();
    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...request, stream: true }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Agnes stream error ${response.status}: ${text}`);
    }
    return response.body;
  }

  // --- Image Generation ---
  async image(request: AgnesImageRequest): Promise<any> {
    await this.waitForRateLimit();
    const body: any = {
      model: request.model,
      prompt: request.prompt,
      size: request.size,
      ratio: request.ratio,
      n: request.n,
    };

    if (request.image) {
      body.extra_body = {
        image: [request.image],
        response_format: request.response_format,
      };
      if (request.negative_prompt) body.extra_body.negative_prompt = request.negative_prompt;
      if (request.steps) body.extra_body.steps = request.steps;
    } else {
      body.extra_body = { response_format: request.response_format };
      if (request.negative_prompt) body.extra_body.negative_prompt = request.negative_prompt;
      if (request.steps) body.extra_body.steps = request.steps;
    }

    if (request.return_base64) body.return_base64 = true;

    const response = await this.fetchWithTimeout(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Agnes image error ${response.status}: ${text}`);
    }
    return response.json();
  }

  // --- Video Generation ---
  async video(request: AgnesVideoRequest): Promise<any> {
    await this.waitForRateLimit();
    const body: any = {
      model: request.model,
      prompt: request.prompt,
      mode: request.mode,
      seconds: request.seconds,
      size: request.size,
      aspect_ratio: request.aspect_ratio,
      n: request.n,
    };

    if (request.seed) body.seed = request.seed;

    if (request.mode === "keyframe") {
      if (request.first_frame) body.first_frame = request.first_frame;
      if (request.last_frame) body.last_frame = request.last_frame;
    }

    if (request.mode === "reference") {
      if (request.images) body.images = request.images;
      if (request.audios) body.audios = request.audios;
      if (request.videos) body.videos = request.videos;
    }

    const response = await this.fetchWithTimeout(`${this.baseUrl}/videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Agnes video error ${response.status}: ${text}`);
    }
    return response.json();
  }

  async videoStatus(videoId: string, modelName: string = "agnes-video-2.5-flash"): Promise<any> {
    await this.waitForRateLimit();
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/agnesapi?video_id=${videoId}&model_name=${modelName}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Agnes video status error ${response.status}: ${text}`);
    }
    return response.json();
  }

  async pollVideo(videoId: string, modelName: string = "agnes-video-2.5-flash", maxAttempts: number = 120, interval: number = 2000): Promise<any> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      const status = await this.videoStatus(videoId, modelName);
      if (status.status === "completed") {
        return status;
      }
      if (status.status === "failed") {
        throw new Error(`Video generation failed: ${status.error?.message || "Unknown error"}`);
      }
      if (attempt > 30) {
        interval = 3000;
      }
    }
    throw new Error("Video generation timed out");
  }
}
