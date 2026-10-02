import { validateAIEnv } from '@/lib/ai/check-env'
import { NextRequest, NextResponse } from 'next/server'
import { generateImage, generateVideo } from '@/lib/ai'
import { verifySession, isResponse, rateLimit } from '@/lib/security/api-guards'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  const user = await verifySession(req)
  if (isResponse(user)) return user

  const limit = rateLimit(`ai-media:${user.id}`, 10, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    )
  }

  try {
    validateAIEnv()
    const formData = await req.formData()
    const file = formData.get('file') as File
    const prompt = formData.get('prompt') as string
    const mode = formData.get('mode') as string

    if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 })
    if (mode !== 'image' && mode !== 'video') {
      return NextResponse.json({ error: "mode must be 'image' or 'video'" }, { status: 400 })
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 })
    }

    const bytes = await file.arrayBuffer()
// @ts-ignore
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    let url: string
    if (mode === 'image') {
      url = await generateImage({
        prompt: prompt || 'Transform this image creatively',
        image: dataUrl,
        size: '2K',
        steps: 40,
      })
    } else {
      url = await generateVideo({
        prompt: prompt || 'Create a dynamic video from this image',
        image: dataUrl,
        duration: 5,
        resolution: '720P',
        motion: 4,
      })
    }

    return NextResponse.json({ url, provider: mode === 'image' ? 'agnes-image' : 'agnes-video' })
  } catch (error) {
    console.error('Media API error:', error)
    return NextResponse.json({ error: 'Media generation failed' }, { status: 500 })
  }
}
