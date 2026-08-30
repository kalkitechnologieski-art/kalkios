import { z } from "zod";

const AGNES_BASE = "https://apihub.agnes-ai.com/v1";

export const AgnesChatRequestSchema = z.object({
  model: z.string().default("agnes-2.0-flash"),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "tool"]),
      content: z.string(),
    })
  ),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().positive().default(4096),
  stream: z.boolean().default(false),
});

export type AgnesChatRequest = z.infer<typeof AgnesChatRequestSchema>;

export class AgnesClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const key = process.env.AGNES_API_KEY;
    if (!key) throw new Error("AGNES_API_KEY not set");
    this.apiKey = key;
    this.baseUrl = AGNES_BASE;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout = 30000
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

  async videoStatus(videoId: string, modelName: string): Promise<any> {
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
}
