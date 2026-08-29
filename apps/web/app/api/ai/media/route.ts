import { NextRequest, NextResponse } from 'next/server'
import { generateImage, generateVideo } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const prompt = formData.get('prompt') as string
    const mode = formData.get('mode') as 'image' | 'video'

    if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 })

    const bytes = await file.arrayBuffer()
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
  } catch (error: any) {
    console.error('Media API error:', error)
    return NextResponse.json({ error: error.message || 'Media generation failed' }, { status: 500 })
  }
}
