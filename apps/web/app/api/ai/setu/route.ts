import { NextRequest } from "next/server";
import { SETUAgent } from "@/lib/agents/setu/agent";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { query, answers } = await req.json();
  if (!query) {
    return new Response(JSON.stringify({ error: "Query required" }), { status: 400 });
  }
  const agent = new SETUAgent(query);
  if (!answers || answers.length === 0) {
    const questions = await agent.generateQuestions();
    return new Response(JSON.stringify({ questions }), { status: 200 });
  }
  await agent.answerQuestions(answers);
  await agent.executeSearch();
  return new Response(
    JSON.stringify({ leads: agent.getLeads(), csv: agent.getCSV(), summary: agent.getSummary() }),
    { status: 200 }
  );
}
