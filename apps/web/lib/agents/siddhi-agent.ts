import { IntelligentRouter } from "@/lib/orchestration/router";
import { ChainOfThought } from "@/lib/reasoning/chain-of-thought";
import { SETUAgent } from "./setu/agent";
import { SIDDHI_SYSTEM_PROMPT } from "@/lib/prompts/siddhi-system";

type Intent = "general" | "deep_think" | "web_search" | "generate_image" | "generate_video" | "run_setu";

export class SiddhiAgent {
  private router: IntelligentRouter;
  private cot: ChainOfThought;

  constructor() {
    this.router = new IntelligentRouter();
    this.cot = new ChainOfThought();
  }

  async process(request: { messages: any[]; userId?: string; stream?: boolean }) {
    const { messages, userId, stream = true } = request;
    const lastMessage = messages[messages.length - 1]?.content || "";

    const intent = this.detectIntent(lastMessage);

    try {
      if (intent === "deep_think") {
        return this.handleDeepThink(lastMessage, stream);
      }

      if (intent === "web_search") {
        return this.handleWebSearch(lastMessage, stream);
      }

      if (intent === "run_setu") {
        return this.handleSETU(lastMessage, stream);
      }

      if (intent === "generate_image") {
        return this.handleImageGeneration(lastMessage, stream);
      }

      if (intent === "generate_video") {
        return this.handleVideoGeneration(lastMessage, stream);
      }

      const enhancedMessages = [{ role: "system", content: SIDDHI_SYSTEM_PROMPT }, ...messages];
      return this.router.route({
        messages: enhancedMessages,
        stream,
        userId,
        tools: [
          {
            type: "function",
            function: {
              name: "web_search",
              description: "Search the web for real-time information.",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "The search query." },
                },
                required: ["query"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "generate_image",
              description: "Generate an image from a text prompt.",
              parameters: {
                type: "object",
                properties: {
                  prompt: { type: "string", description: "The image description." },
                  size: { type: "string", enum: ["1K", "2K", "3K", "4K"] },
                  ratio: { type: "string", enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"] },
                },
                required: ["prompt"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "generate_video",
              description: "Generate a short video from a text prompt.",
              parameters: {
                type: "object",
                properties: {
                  prompt: { type: "string", description: "The video description." },
                  duration: { type: "string", enum: ["5", "10"] },
                  resolution: { type: "string", enum: ["720P", "1080P", "4K"] },
                },
                required: ["prompt"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "run_setu",
              description: "Find business leads based on criteria.",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "The lead search query." },
                  count: { type: "number", description: "Number of leads to find." },
                },
                required: ["query"],
              },
            },
          },
        ],
      });
    } catch (error) {
      console.error("[ADMIN] SiddhiAgent error:", error);
      return {
        type: "content",
        content: "I'm having trouble processing your request. Please try again later.",
      };
    }
  }

  private detectIntent(query: string): Intent {
    const lower = query.toLowerCase();

    if (lower.includes("generate image") || lower.includes("create image") || lower.includes("draw")) return "generate_image";
    if (lower.includes("generate video") || lower.includes("create video") || lower.includes("animate")) return "generate_video";
    if (lower.includes("lead") || lower.includes("prospect") || lower.includes("find customers")) return "run_setu";
    if (lower.includes("search") || lower.includes("find") || lower.includes("latest news")) return "web_search";
    if (
      lower.includes("explain") ||
      lower.includes("analyze") ||
      lower.includes("why") ||
      lower.includes("how") ||
      lower.length > 30
    ) {
      return "deep_think";
    }
    return "general";
  }

  private async handleDeepThink(query: string, stream: boolean) {
    return this.cot.generate(query, { stream, deep: true });
  }

  private async handleWebSearch(query: string, stream: boolean) {
    return this.cot.generate(query, { stream, deep: false });
  }

  private async handleSETU(query: string, stream: boolean) {
    const agent = new SETUAgent(query);
    const questions = await agent.generateQuestions();
    if (questions.length > 0) {
      return {
        type: "questions",
        questions,
        stream: false,
      };
    }
    return {
      type: "setu_pending",
      message: "Please answer the clarifying questions.",
      questions,
      stream: false,
    };
  }

  private async handleImageGeneration(query: string, stream: boolean) {
    return this.router.route({
      messages: [{ role: "user", content: `Generate image: ${query}` }],
      stream,
    });
  }

  private async handleVideoGeneration(query: string, stream: boolean) {
    return this.router.route({
      messages: [{ role: "user", content: `Generate video: ${query}` }],
      stream,
    });
  }
}
