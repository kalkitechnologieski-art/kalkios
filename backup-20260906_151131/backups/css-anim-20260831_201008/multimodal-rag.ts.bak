export interface FileAttachment {
  id: string
  file: File
  type: 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'txt'
  name: string
  size: number
  dataUrl: string
  extractedText?: string
  metadata?: Record<string, any>
}

export class MultimodalRAG {
  private static instance: MultimodalRAG

  static getInstance(): MultimodalRAG {
    if (!MultimodalRAG.instance) {
      MultimodalRAG.instance = new MultimodalRAG()
    }
    return MultimodalRAG.instance
  }

  async processFile(file: File): Promise<FileAttachment> {
    const type = this.detectFileType(file)
    const dataUrl = await this.fileToDataUrl(file)
    let extractedText = ''
    let metadata = {}
    // For now, just store basic info
    return {
      id: crypto.randomUUID(),
      file,
      type,
      name: file.name,
      size: file.size,
      dataUrl,
      extractedText,
      metadata,
    }
  }

  async processMultiple(files: File[]): Promise<FileAttachment[]> {
    return Promise.all(files.map(f => this.processFile(f)))
  }

  private detectFileType(file: File): FileAttachment['type'] {
    const type = file.type
    if (type.startsWith('image/')) return 'image'
    if (type.startsWith('video/')) return 'video'
    if (type.startsWith('audio/')) return 'audio'
    if (type === 'application/pdf') return 'pdf'
    if (type.includes('document') || type.includes('word')) return 'doc'
    return 'txt'
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  buildContextFromAttachments(attachments: FileAttachment[]): string {
    const parts = attachments.map(a => {
      let content = `File: ${a.name} (${a.type})\n`
      if (a.extractedText) {
        content += `Content: ${a.extractedText.slice(0, 500)}${a.extractedText.length > 500 ? '...' : ''}\n`
      }
      return content
    })
    return parts.join('\n---\n')
  }
}
