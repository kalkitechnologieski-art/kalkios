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

  constructor() {
    const key = process.env.AGNES_API_KEY;
    if (!key) {
      console.warn("[DIAGNOSTIC] AGNES_API_KEY not set");
      // We'll allow the client to be created but will fail gracefully on calls
    }
    this.apiKey = key || "";
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
    if (!this.apiKey) {
      throw new Error("AGNES_API_KEY is not set");
    }
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
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Agnes service unavailable (${response.status}): please try again later`);
      }
      throw new Error(`Agnes chat error ${response.status}: ${text}`);
    }
    const data = await response.json();
    if (!data.choices?.[0]?.message?.content && !data.choices?.[0]?.message?.reasoning_content) {
      throw new Error("Agnes returned empty response");
    }
    return data;
  }

  async chatStream(request: AgnesChatRequest): Promise<ReadableStream | null> {
    if (!this.apiKey) {
      throw new Error("AGNES_API_KEY is not set");
    }
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
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Agnes service unavailable (${response.status}): please try again later`);
      }
      throw new Error(`Agnes stream error ${response.status}: ${text}`);
    }
    return response.body;
  }

  async image(body: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error("AGNES_API_KEY is not set");
    }
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
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Agnes image service unavailable (${response.status})`);
      }
      throw new Error(`Agnes image error ${response.status}: ${text}`);
    }
    return response.json();
  }

  async video(body: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error("AGNES_API_KEY is not set");
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
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Agnes video service unavailable (${response.status})`);
      }
      throw new Error(`Agnes video error ${response.status}: ${text}`);
    }
    return response.json();
  }

  async videoStatus(videoId: string, modelName: string = "agnes-video-2.5-flash"): Promise<any> {
    if (!this.apiKey) {
      throw new Error("AGNES_API_KEY is not set");
    }
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/agnesapi?video_id=${videoId}&model_name=${modelName}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );
    if (!response.ok) {
      const text = await response.text();
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Agnes video status service unavailable (${response.status})`);
      }
      throw new Error(`Agnes video status error ${response.status}: ${text}`);
    }
    return response.json();
  }
}
