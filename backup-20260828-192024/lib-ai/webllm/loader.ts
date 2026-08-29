/**
 * WebLLM Service – Enterprise-grade SLM loading with Transformers.js v4
 * Supports background download, progress tracking, and graceful fallback.
 */

import { pipeline } from '@huggingface/transformers'

export interface SLMServiceType {
  loadModel(model: 'phi-3-mini' | 'gemma-2b'): Promise<void>
  isLoaded(): boolean
  isDownloading(): boolean
  getDownloadProgress(): number
  reason(prompt: string): Promise<{ text: string; timeMs: number; tokens?: number }>
  extract(text: string): Promise<any>
  validate(contact: any): Promise<{ valid: boolean; confidence: number }>
  unload(): void
}

type PipelineType = Awaited<ReturnType<typeof pipeline>>

let reasoningPipeline: PipelineType | null = null
let validationPipeline: PipelineType | null = null
let isLoaded = false
let isDownloading = false
let downloadProgress = 0

async function callPipeline(pipelineInstance: PipelineType, prompt: string, options: any) {
  const result = await (pipelineInstance as any)(prompt, options)
  if (Array.isArray(result) && result.length > 0) {
    return result[0]?.generated_text ?? ''
  }
  if (result && typeof result === 'object' && 'generated_text' in result) {
    return result.generated_text || ''
  }
  return String(result)
}

export const SLMService: SLMServiceType = {
  async loadModel(model: 'phi-3-mini' | 'gemma-2b'): Promise<void> {
    if (isLoaded) return
    if (isDownloading) return

    isDownloading = true
    downloadProgress = 0

    try {
      const modelMap: Record<string, string> = {
        'phi-3-mini': 'onnx-community/Phi-3-mini-4k-instruct',
        'gemma-2b': 'onnx-community/Gemma-2B',
      }

      const modelName = modelMap[model] || modelMap['phi-3-mini']

      reasoningPipeline = await pipeline(
        'text2text-generation',
        modelName,
        {
          dtype: 'q4',
          device: 'wasm',
          progress_callback: (progressInfo: any) => {
            downloadProgress = progressInfo.progress || 0
            console.log(`[WebLLM] Loading ${model}: ${Math.round(downloadProgress * 100)}%`)
          }
        }
      )

      validationPipeline = await pipeline(
        'text2text-generation',
        'onnx-community/Gemma-2B',
        { dtype: 'q4', device: 'wasm' }
      )

      isLoaded = true
      isDownloading = false
      downloadProgress = 1

      // Dispatch event for UI progress
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('slm-progress', {
          detail: { progress: 1, loaded: true }
        }))
      }

    } catch (error) {
      console.warn('[WebLLM] Loading failed, fallback to CPU:', error)
      isDownloading = false
      downloadProgress = 0
      // Fallback: CPU
      try {
        reasoningPipeline = await pipeline(
          'text2text-generation',
          'onnx-community/Phi-3-mini-4k-instruct',
          { dtype: 'q4', device: 'cpu' }
        )
        validationPipeline = await pipeline(
          'text2text-generation',
          'onnx-community/Gemma-2B',
          { dtype: 'q4', device: 'cpu' }
        )
        isLoaded = true
        isDownloading = false
        downloadProgress = 1
      } catch (fallbackError) {
        console.warn('[WebLLM] CPU fallback also failed.')
        isLoaded = false
        isDownloading = false
        downloadProgress = 0
        throw new Error('SLM loading failed on all backends.')
      }
    }
  },

  isLoaded(): boolean { return isLoaded },

  isDownloading(): boolean { return isDownloading },

  getDownloadProgress(): number { return downloadProgress },

  async reason(prompt: string) {
    if (!reasoningPipeline) await this.loadModel('phi-3-mini')
    const startTime = performance.now()
    const text = await callPipeline(reasoningPipeline!, prompt, {
      max_new_tokens: 512,
      temperature: 0.3,
      do_sample: true,
    })
    return { text, timeMs: performance.now() - startTime }
  },

  async extract(text: string) {
    if (!validationPipeline) await this.loadModel('gemma-2b')
    const prompt = `Extract contact information from the following text. Return ONLY valid JSON with these fields: name, email, phone, company, jobTitle, linkedinUrl, twitterUrl, city, country. If a field is missing, use null. Text: ${text.slice(0, 4000)} JSON:`
    const raw = await callPipeline(validationPipeline!, prompt, {
      max_new_tokens: 256,
      temperature: 0.1,
    })
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    return {
      name: parsed.name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      company: parsed.company || null,
      jobTitle: parsed.jobTitle || null,
      linkedinUrl: parsed.linkedinUrl || null,
      twitterUrl: parsed.twitterUrl || null,
      city: parsed.city || null,
      country: parsed.country || null,
      confidence: parsed.confidence || 0.5,
    }
  },

  async validate(contact: any) {
    if (!validationPipeline) await this.loadModel('gemma-2b')
    const hasContact = !!(contact.email || contact.phone)
    if (!hasContact) return { valid: false, confidence: 0 }
    const prompt = `Validate the following lead data. Return JSON: { "valid": true/false, "confidence": 0-1 } Data: ${JSON.stringify(contact)}`
    const raw = await callPipeline(validationPipeline!, prompt, {
      max_new_tokens: 64,
      temperature: 0.1,
    })
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { valid: hasContact, confidence: 0.5 }
    return { valid: parsed.valid ?? hasContact, confidence: parsed.confidence ?? 0.5 }
  },

  unload(): void {
    reasoningPipeline = null
    validationPipeline = null
    isLoaded = false
    isDownloading = false
    downloadProgress = 0
    if (global.gc) global.gc()
  },
}

// Auto-start background download after page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait a few seconds for critical resources, then start background download
    setTimeout(() => {
      SLMService.loadModel('phi-3-mini').catch(() => {})
    }, 3000)
  })
}
