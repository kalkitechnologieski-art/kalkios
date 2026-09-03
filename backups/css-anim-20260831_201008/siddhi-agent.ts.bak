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
    console.log("[SiddhiAgent] Intent:", intent);

    try {
      switch (intent) {
        case "deep_think":
          return await this.handleDeepThink(lastMessage, stream);
        case "web_search":
          return await this.handleWebSearch(lastMessage, stream);
        case "run_setu":
          return await this.handleSETU(lastMessage, stream);
        case "generate_image":
          return await this.handleImageGeneration(lastMessage, stream);
        case "generate_video":
          return await this.handleVideoGeneration(lastMessage, stream);
        default:
          const enhancedMessages = [{ role: "system", content: SIDDHI_SYSTEM_PROMPT }, ...messages];
          return await this.router.route({
            messages: enhancedMessages,
            stream,
            userId,
          });
      }
    } catch (error: any) {
      console.error("[SiddhiAgent] Error:", error);
      return {
        type: "content",
        content: "I encountered an issue. Please try again.",
      };
    }
  }

  private detectIntent(query: string): Intent {
    const lower = query.toLowerCase();
    if (lower.includes("generate image") || lower.includes("create image") || lower.includes("draw")) return "generate_image";
    if (lower.includes("generate video") || lower.includes("create video") || lower.includes("animate")) return "generate_video";
    if (lower.includes("lead") || lower.includes("prospect") || lower.includes("find customers") || lower.includes("find leads")) return "run_setu";
    if (lower.includes("search") || lower.includes("find") || lower.includes("latest news") || lower.includes("today")) return "web_search";
    if (lower.includes("explain") || lower.includes("analyze") || lower.includes("why") || lower.includes("how") || lower.length > 30) {
      return "deep_think";
    }
    return "general";
  }

  private async handleDeepThink(query: string, stream: boolean) {
    return this.cot.generate(query, { stream, deep: true });
  }

  private async handleWebSearch(query: string, stream: boolean) {
    // ChainOfThought with deep=false does web search and synthesis
    return this.cot.generate(query, { stream, deep: false });
  }

  private async handleSETU(query: string, stream: boolean) {
    const agent = new SETUAgent(query);
    const questions = await agent.generateQuestions();
    if (questions.length > 0) {
      return { type: "questions", questions, stream: false };
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
