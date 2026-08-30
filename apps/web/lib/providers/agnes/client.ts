import { z } from "zod";

const AGNES_BASE = "https://apihub.agnes-ai.com/v1";

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
  thinking: z.object({
    type: z.enum(["enabled", "disabled"]),
    budget_tokens: z.number().optional(),
  }).optional(),
});

export type AgnesChatRequest = z.infer<typeof AgnesChatRequestSchema>;

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
    this.rpm = 20;
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
    const data = await response.json();
    // Agnes sometimes returns empty content with thinking mode
    if (data.choices?.[0]?.message?.content === "" && data.choices?.[0]?.message?.reasoning_content) {
      // If content is empty but reasoning exists, use a default message
      data.choices[0].message.content = "I've processed your request. Please continue.";
    }
    return data;
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

  async image(body: any): Promise<any> {
    await this.waitForRateLimit();
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

  async video(body: any): Promise<any> {
    await this.waitForRateLimit();
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
