import { NextRequest, NextResponse } from "next/server";
import { SETUAgent } from "@/lib/agents/setu/agent";
import { verifySession, isResponse, rateLimit } from "@/lib/security/api-guards";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;

  const limit = rateLimit(`ai-setu:${user.id}`, 10, 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  let body: { query?: unknown; answers?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { query, answers } = body;
  if (typeof query !== 'string' || !query.trim()) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 });
  }

  try {
    const agent = new SETUAgent(query);
    if (!Array.isArray(answers) || answers.length === 0) {
      const questions = await agent.generateQuestions();
      return NextResponse.json({ questions });
    }
    await agent.answerQuestions(answers as string[]);
    await agent.executeSearch();
    return NextResponse.json({
      leads: agent.getLeads(),
      csv: agent.getCSV(),
      summary: agent.getSummary(),
    });
  } catch (error) {
    console.error('Setu API error:', error);
    return NextResponse.json({ error: 'Setu run failed' }, { status: 500 });
  }
}
