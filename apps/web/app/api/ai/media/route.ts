import { NextRequest, NextResponse } from 'next/server'
import { generateImage, generateVideo } from '@/lib/ai/agnes'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const prompt = formData.get('prompt') as string
    const mode = formData.get('mode') as 'image' | 'video'

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    let result
    if (mode === 'image') {
      result = await generateImage({
        prompt: prompt || 'Transform this image creatively',
        image: dataUrl,
        resolution: '2K',
        steps: 40,
      })
    } else {
      result = await generateVideo({
        prompt: prompt || 'Create a dynamic video from this image',
        image: dataUrl,
        duration: 5,
        resolution: '720p',
        motion: 4,
      })
    }

    return NextResponse.json({ url: result.url, provider: result.provider })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Media generation failed' },
      { status: 500 }
    )
  }
}
