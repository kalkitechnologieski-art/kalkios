import { z } from "zod";

const ZHIPU_BASE = "https://api.z.ai/api/paas/v4";

export const ZhipuChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "tool"]),
      content: z.string(),
    })
  ),
  model: z.enum(["glm-5.3", "glm-5.3-flash", "glm-4.7", "glm-4.6"]).default("glm-5.3"),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().positive().default(4096),
  thinking: z
    .object({
      type: z.enum(["enabled", "disabled"]),
      clear_thinking: z.boolean().optional(),
    })
    .optional(),
  reasoning_effort: z.enum(["low", "medium", "high", "max"]).optional(),
  tools: z.array(z.any()).optional(),
  tool_choice: z.enum(["auto", "none"]).optional(),
  stream: z.boolean().default(false),
});

export type ZhipuChatRequest = z.infer<typeof ZhipuChatRequestSchema>;

export class ZhipuClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const key = process.env.ZHIPU_API_KEY;
    if (!key) throw new Error("ZHIPU_API_KEY not set");
    this.apiKey = key;
    this.baseUrl = ZHIPU_BASE;
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

  async chat(request: ZhipuChatRequest): Promise<any> {
    const body: any = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      stream: request.stream || false,
    };

    if (request.thinking) body.thinking = request.thinking;
    if (request.reasoning_effort) body.reasoning_effort = request.reasoning_effort;
    if (request.tools) body.tools = request.tools;
    if (request.tool_choice) body.tool_choice = request.tool_choice;

    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Accept-Language": "en-US,en",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Zhipu chat error ${response.status}: ${text}`);
    }
    return response.json();
  }

  async webSearch(body: any): Promise<any> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/web_search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Accept-Language": "en-US,en",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Zhipu web search error ${response.status}: ${text}`);
    }
    return response.json();
  }

  async webReader(body: any): Promise<any> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/reader`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Zhipu web reader error ${response.status}: ${text}`);
    }
    return response.json();
  }
}
