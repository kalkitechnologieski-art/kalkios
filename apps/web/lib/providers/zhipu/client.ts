import { z } from "zod";

const ZHIPU_BASE = "https://api.z.ai/api/paas/v4";

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

  async chat(body: any): Promise<any> {
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
    const data = await response.json();
    // Zhipu may return empty content with usage data – handle gracefully[reference:8]
    if (data.choices?.[0]?.delta?.content === "" && data.usage) {
      // If we got usage but empty content, the stream might have completed
      // Return a fallback message to avoid empty response
      if (data.choices[0].finish_reason === "stop") {
        data.choices[0].delta.content = "I've processed your request. Please continue.";
      }
    }
    return data;
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
