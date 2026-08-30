import { AgnesClient } from "@/lib/providers/agnes/client";
import { ZhipuClient } from "@/lib/providers/zhipu/client";

export class ChainOfThought {
  private agnes: AgnesClient;
  private zhipu: ZhipuClient;

  constructor() {
    this.agnes = new AgnesClient();
    this.zhipu = new ZhipuClient();
  }

  async generate(
    query: string,
    options: { stream?: boolean; deep?: boolean } = {}
  ): Promise<AsyncGenerator<any, void, unknown>> {
    const { stream = true, deep = false } = options;

    let sources: any[] = [];
    let groundedPrompt = query;

    if (deep) {
      try {
        const searchResults = await this.zhipu.webSearch({
          search_query: query,
          count: 8,
          search_recency_filter: "noLimit",
        });

        for (const result of searchResults.search_result || []) {
          try {
            const reader = await this.zhipu.webReader({
              url: result.link,
              return_format: "markdown",
            });
            sources.push({ ...result, content: reader.reader_result?.content || "" });
          } catch (_) {}
        }

        const context = sources.map((s) => `[${s.title}](${s.link}): ${s.content.slice(0, 500)}`).join("\n\n");
        groundedPrompt = `Answer the following question based on these sources:\n${context}\n\nQuestion: ${query}`;
      } catch (error) {
        console.warn("Web grounding failed, falling back to regular query:", error);
        groundedPrompt = query;
      }
    }

    const messages = [
      { role: "system", content: "You are Siddhi, an AI assistant that provides step‑by‑step reasoning." },
      { role: "user", content: groundedPrompt },
    ];

    const body: any = {
      messages,
      model: "agnes-2.0-flash",
      temperature: 0.3,
      max_tokens: 4096,
      stream,
    };
    if (deep) body.chat_template_kwargs = { enable_thinking: true };

    const streamBody = await this.agnes.chatStream(body);
    if (!streamBody) throw new Error("Agnes stream returned null");
    return this.processStream(streamBody, sources);
  }

  private async *processStream(stream: ReadableStream, sources: any[]): AsyncGenerator<any, void, unknown> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let reasoning = "";
    let content = "";
    let hasContent = false;
    let timeout: NodeJS.Timeout | undefined;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Stream timeout")), 60000);
      });

      while (true) {
        const readPromise = reader.read();
        const { done, value } = await Promise.race([readPromise, timeoutPromise]) as any;
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.reasoning_content) {
                reasoning += delta.reasoning_content;
                yield { type: "reasoning", content: delta.reasoning_content, sources };
              }
              if (delta?.content) {
                content += delta.content;
                hasContent = true;
                yield { type: "content", content: delta.content };
              }
              if (parsed.usage) {
                yield { type: "usage", tokens: parsed.usage.total_tokens };
              }
            } catch (_) {}
          }
        }
      }

      if (!hasContent && content.length === 0) {
        yield {
          type: "content",
          content: "I could not generate a complete response. Please try rephrasing your question.",
        };
      }

      yield { type: "complete", reasoning, content, sources };
    } catch (error: any) {
      yield {
        type: "error",
        message: error.message || "An error occurred during reasoning",
      };
    } finally {
      if (timeout) clearTimeout(timeout);
      try {
        await reader.cancel();
      } catch (_) {}
    }
  }
}
