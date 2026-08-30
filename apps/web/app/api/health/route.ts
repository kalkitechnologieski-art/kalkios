import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: {
      agnes: process.env.AGNES_API_KEY ? "configured" : "missing",
      zhipu: process.env.ZHIPU_API_KEY ? "configured" : "missing",
      groq: process.env.GROQ_API_KEY ? "configured" : "missing",
      openrouter: process.env.OPENROUTER_API_KEY ? "configured" : "missing",
    },
  };
  return NextResponse.json(checks, { status: 200 });
}
