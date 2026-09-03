import { AgnesClient } from "@/lib/providers/agnes/client";

export class Socratic {
  private agnes: AgnesClient;

  constructor() {
    this.agnes = new AgnesClient();
  }

  async generateQuestions(query: string): Promise<string[]> {
    const prompt = `
You are a Socratic questioner. Generate 3‑5 clarifying questions for this query:
"${query}"
Return only the questions, one per line, as a numbered list.
`;
    const response = await this.agnes.chat({
      messages: [{ role: "user", content: prompt }],
      model: "agnes-2.0-flash",
      temperature: 0.3,
      max_tokens: 1024,
      stream: false,
    });
    const content = response.choices?.[0]?.message?.content || "";
    return content
      .split("\n")
      .filter((line: string) => line.trim().length > 10)
      .map((line: string) => line.replace(/^\d+\.\s*/, "").trim());
  }
}
