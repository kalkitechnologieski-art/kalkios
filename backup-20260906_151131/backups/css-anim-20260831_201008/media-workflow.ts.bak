import { generateImage, generateVideo } from './index'
import { FileAttachment } from './multimodal-rag'

export class MediaWorkflow {
  async imageToImage(
    prompt: string,
    image: FileAttachment | string,
    options?: { size?: string; ratio?: string; negativePrompt?: string; steps?: number }
  ): Promise<string> {
    const imageData = typeof image === 'string' ? image : image.dataUrl
    return await generateImage({ prompt, image: imageData, ...options })
  }

  async imageToVideo(
    prompt: string,
    image: FileAttachment | string,
    options?: { duration?: number; resolution?: string; motion?: number }
  ): Promise<string> {
    const imageData = typeof image === 'string' ? image : image.dataUrl
    return await generateVideo({ prompt, image: imageData, ...options })
  }

  async multiImageToVideo(
    prompt: string,
    images: (FileAttachment | string)[],
    options?: { duration?: number; resolution?: string }
  ): Promise<string> {
    const imageUrls = images.map(img => typeof img === 'string' ? img : img.dataUrl)
    return await generateVideo({ prompt, image: imageUrls[0], ...options })
  }
}
