import { ChatMessage } from './types'
import { FileAttachment } from './multimodal-rag'

export interface ConversationState {
  id: string
  messages: ChatMessage[]
  intent: string
  mode: 'chat' | 'image' | 'video' | 'search' | 'lead'
  attachments: FileAttachment[]
  currentStep: number
  totalSteps: number
  metadata: Record<string, any>
}

export class ContextManager {
  private state: ConversationState
  private static instance: ContextManager

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager()
    }
    return ContextManager.instance
  }

  constructor() {
    this.state = {
      id: crypto.randomUUID(),
      messages: [],
      intent: 'chat',
      mode: 'chat',
      attachments: [],
      currentStep: 0,
      totalSteps: 0,
      metadata: {},
    }
  }

  update(message: ChatMessage, attachments: FileAttachment[] = []): void {
    this.state.messages.push(message)
    if (attachments.length > 0) {
      this.state.attachments = attachments
    }
    this.state.intent = this.detectIntent(message.content)
    this.state.mode = this.detectMode(message.content)
    this.state.currentStep++
    this.state.totalSteps++
  }

  getContext(): string {
    const parts = [
      `## Conversation State`,
      `- Mode: ${this.state.mode}`,
      `- Intent: ${this.state.intent}`,
      `- Total Messages: ${this.state.messages.length}`,
      `- Attachments: ${this.state.attachments.length}`,
      ``,
      `## Recent Messages`,
      ...this.state.messages.slice(-5).map(m => `${m.role}: ${m.content.slice(0, 100)}`),
      ``,
      `## Attachments Summary`,
      ...this.state.attachments.map(a => `- ${a.name} (${a.type})`),
    ]
    return parts.join('\n')
  }

  getState(): ConversationState {
    return { ...this.state }
  }

  private detectIntent(content: string): string {
    const lower = content.toLowerCase()
    if (lower.includes('generate image') || lower.includes('create image')) return 'image'
    if (lower.includes('generate video') || lower.includes('create video')) return 'video'
    if (lower.includes('search') || lower.includes('find')) return 'search'
    if (lower.includes('lead') || lower.includes('prospect')) return 'lead'
    return 'chat'
  }

  private detectMode(content: string): ConversationState['mode'] {
    const lower = content.toLowerCase()
    if (lower.includes('image')) return 'image'
    if (lower.includes('video')) return 'video'
    if (lower.includes('search')) return 'search'
    if (lower.includes('lead')) return 'lead'
    return 'chat'
  }

  reset(): void {
    this.state = {
      id: crypto.randomUUID(),
      messages: [],
      intent: 'chat',
      mode: 'chat',
      attachments: [],
      currentStep: 0,
      totalSteps: 0,
      metadata: {},
    }
  }
}
