import { z } from "zod";

const OR_BASE = "https://openrouter.ai/api/v1";

export const OpenRouterChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "tool"]),
      content: z.string(),
    })
  ),
  model: z.string().default("meta-llama/llama-3.2-3b-instruct:free"),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().positive().default(4096),
  stream: z.boolean().default(false),
});

export type OpenRouterChatRequest = z.infer<typeof OpenRouterChatRequestSchema>;

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error("OPENROUTER_API_KEY not set");
    this.apiKey = key;
    this.baseUrl = OR_BASE;
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

  async chat(request: OpenRouterChatRequest): Promise<any> {
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
      throw new Error(`OpenRouter chat error ${response.status}: ${text}`);
    }
    return response.json();
  }

  async chatStream(request: OpenRouterChatRequest): Promise<ReadableStream | null> {
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
      throw new Error(`OpenRouter stream error ${response.status}: ${text}`);
    }
    return response.body;
  }
}
