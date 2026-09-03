import { chat } from './index'

export interface EnhancedPrompt {
  original: string
  enhanced: string
  intent: 'chat' | 'image' | 'video' | 'search' | 'lead'
  keyElements: {
    subject: string
    action: string
    constraints: string[]
    context: string
    style?: string
  }
}

export class PromptEnhancer {
  private static instance: PromptEnhancer

  static getInstance(): PromptEnhancer {
    if (!PromptEnhancer.instance) {
      PromptEnhancer.instance = new PromptEnhancer()
    }
    return PromptEnhancer.instance
  }

  async enhance(input: string, mode: 'chat' | 'image' | 'video' | 'search'): Promise<EnhancedPrompt> {
    const elements = this.extractElements(input)
    const intent = this.detectIntent(input)
    const enhanced = this.buildStructuredPrompt(elements, intent, mode)
    return {
      original: input,
      enhanced,
      intent,
      keyElements: elements,
    }
  }

  private extractElements(input: string): EnhancedPrompt['keyElements'] {
    const subject = this.extractSubject(input)
    const action = this.extractAction(input)
    const constraints = this.extractConstraints(input)
    const context = this.extractContext(input)
    return { subject, action, constraints, context }
  }

  private detectIntent(input: string): EnhancedPrompt['intent'] {
    const lower = input.toLowerCase()
    if (lower.includes('generate image') || lower.includes('create image') || lower.includes('draw')) return 'image'
    if (lower.includes('generate video') || lower.includes('create video') || lower.includes('animate')) return 'video'
    if (lower.includes('search') || lower.includes('find') || lower.includes('look up')) return 'search'
    if (lower.includes('lead') || lower.includes('prospect') || lower.includes('find customers')) return 'lead'
    return 'chat'
  }

  private buildStructuredPrompt(elements: EnhancedPrompt['keyElements'], intent: string, mode: string): string {
    // Build a clean, concise prompt without markdown headings
    let parts = []
    parts.push(`User query: ${elements.subject} ${elements.action}`)
    if (elements.context && elements.context !== elements.subject) {
      parts.push(`Context: ${elements.context}`)
    }
    if (elements.constraints.length > 0) {
      parts.push(`Constraints: ${elements.constraints.join(', ')}`)
    }
    parts.push(`Mode: ${mode.toUpperCase()}`)
    return parts.join(' ')
  }

  private extractSubject(input: string): string {
    const patterns = [
      /(?:about|for|regarding)\s+([^,.]+)/i,
      /(?:generate|create|make)\s+(?:an?\s+)?([^,.]+)/i,
    ]
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match && match[1]) return match[1].trim()
    }
    return input.slice(0, 50)
  }

  private extractAction(input: string): string {
    const verbs = ['generate', 'create', 'make', 'build', 'design', 'develop', 'find', 'search', 'analyze', 'explain']
    for (const verb of verbs) {
      if (input.toLowerCase().includes(verb)) return verb
    }
    return 'assist'
  }

  private extractConstraints(input: string): string[] {
    const constraints: string[] = []
    const patterns = [
      /(?:within|in|under)\s+([^,.]+)/i,
      /(?:using|with)\s+([^,.]+)/i,
      /(?:without|excluding)\s+([^,.]+)/i,
    ]
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match && match[1]) constraints.push(match[1].trim())
    }
    return constraints
  }

  private extractContext(input: string): string {
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 10)
    return sentences.slice(0, 3).join('. ') || input
  }
}
