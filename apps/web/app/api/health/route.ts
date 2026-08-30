import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: {
      AGNES_API_KEY: process.env.AGNES_API_KEY ? 'set' : 'missing',
      ZHIPU_API_KEY: process.env.ZHIPU_API_KEY ? 'set' : 'missing',
      GROQ_API_KEY: process.env.GROQ_API_KEY ? 'set' : 'missing',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'set' : 'missing',
    }
  }
  return NextResponse.json(checks, { status: 200 })
}
