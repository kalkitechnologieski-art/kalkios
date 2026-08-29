export enum CognitiveAxis {
  RATIONAL_INTUITIVE = 'rational_intuitive',
  ANALYTICAL_SYNTHESIZING = 'analytical_synthesizing',
  CONVERGENT_DIVERGENT = 'convergent_divergent',
  EXPLORATORY_FOCUSED = 'exploratory_focused',
  CREATIVE_ANALYTICAL = 'creative_analytical',
}

export interface PendulumState {
  axis: CognitiveAxis
  position: number // -1 to 1
  amplitude: number
  frequency: number
  entropy: number
  coherence: number
  thinkingDepth: number
  creativity: number
  reasoningEffort: 'low' | 'medium' | 'high' | 'max'
  // Memory & context
  memory: string[]
  lastImagePrompt?: string
  lastVideoPrompt?: string
  imageCount: number
  videoCount: number
  totalQueries: number
}

export class QuantumPendulum {
  private state: PendulumState
  private lastUpdate: number
  private queryHistory: string[] = []

  constructor() {
    this.state = {
      axis: CognitiveAxis.RATIONAL_INTUITIVE,
      position: 0,
      amplitude: 0.7,
      frequency: 0.7,
      entropy: 0.42,
      coherence: 0.87,
      thinkingDepth: 0.5,
      creativity: 0.5,
      reasoningEffort: 'medium',
      memory: [],
      imageCount: 0,
      videoCount: 0,
      totalQueries: 0,
    }
    this.lastUpdate = Date.now()
  }

  private getNow(): number {
    return Date.now()
  }

  update(query: string): void {
    const now = this.getNow()
    const delta = (now - this.lastUpdate) / 1000
    this.lastUpdate = now

    // Store query in memory
    this.state.memory.push(query)
    if (this.state.memory.length > 20) this.state.memory.shift()
    this.state.totalQueries++

    // Detect media generation intents
    if (query.toLowerCase().includes('generate image') || query.toLowerCase().includes('create image') || query.toLowerCase().includes('draw')) {
      this.state.lastImagePrompt = query
      this.state.imageCount++
      this.state.axis = CognitiveAxis.CREATIVE_ANALYTICAL
      this.state.creativity = 0.9
      this.state.thinkingDepth = 0.4
    }
    if (query.toLowerCase().includes('generate video') || query.toLowerCase().includes('create video') || query.toLowerCase().includes('animate')) {
      this.state.lastVideoPrompt = query
      this.state.videoCount++
      this.state.axis = CognitiveAxis.CREATIVE_ANALYTICAL
      this.state.creativity = 0.8
      this.state.thinkingDepth = 0.5
    }

    // Oscillation
    const oscillation = Math.sin(2 * Math.PI * this.state.frequency * delta)
    this.state.position += oscillation * this.state.amplitude * 0.1
    this.state.position = Math.max(-1, Math.min(1, this.state.position))

    // Adjust based on query characteristics
    const isTechnical = this.isTechnicalQuery(query)
    const isCreative = this.isCreativeQuery(query)
    const isComplex = this.isComplexQuery(query)
    const isAmbiguous = this.isAmbiguousQuery(query)

    if (isTechnical) {
      this.state.axis = CognitiveAxis.RATIONAL_INTUITIVE
      this.state.position = Math.max(this.state.position - 0.15, -1)
      this.state.thinkingDepth = 0.8
      this.state.creativity = 0.3
      this.state.reasoningEffort = 'max'
    }

    if (isCreative) {
      this.state.axis = CognitiveAxis.CONVERGENT_DIVERGENT
      this.state.position = Math.min(this.state.position + 0.15, 1)
      this.state.thinkingDepth = 0.6
      this.state.creativity = 0.9
      this.state.reasoningEffort = 'high'
    }

    if (isComplex) {
      this.state.thinkingDepth = 0.9
      this.state.entropy = 0.5
      this.state.reasoningEffort = 'max'
    }

    if (isAmbiguous) {
      this.state.axis = CognitiveAxis.EXPLORATORY_FOCUSED
      this.state.entropy = 0.7
      this.state.thinkingDepth = 0.7
    }

    // Random fluctuation (quantum jitter)
    this.state.entropy = 0.3 + 0.4 * (1 - Math.abs(this.state.position))
    this.state.coherence = 0.9 - 0.3 * this.state.entropy

    if (this.state.coherence < 0.2) this.state.coherence = 0.2
  }

  private isTechnicalQuery(query: string): boolean {
    const terms = ['code', 'api', 'database', 'server', 'development', 'fix', 'build', 'deploy', 'architecture', 'algorithm', 'function', 'class', 'method', 'variable', 'error', 'debug', 'test', 'performance', 'security']
    return terms.some((t) => query.toLowerCase().includes(t))
  }

  private isCreativeQuery(query: string): boolean {
    const terms = ['design', 'creative', 'brand', 'story', 'visual', 'marketing', 'content', 'idea', 'innovate', 'imagine', 'art', 'style', 'aesthetic', 'beautiful', 'elegant']
    return terms.some((t) => query.toLowerCase().includes(t))
  }

  private isComplexQuery(query: string): boolean {
    const terms = ['analyze', 'compare', 'evaluate', 'synthesize', 'optimize', 'strategy', 'comprehensive', 'detailed', 'explain', 'why', 'how', 'what if', 'scenario']
    const wordCount = query.split(' ').length
    return terms.some((t) => query.toLowerCase().includes(t)) || wordCount > 15
  }

  private isAmbiguousQuery(query: string): boolean {
    const terms = ['maybe', 'perhaps', 'could', 'might', 'possibly', 'not sure', 'help', 'what do you think', 'suggestion', 'opinion']
    return terms.some((t) => query.toLowerCase().includes(t)) || query.endsWith('?')
  }

  getModelParams(): { temperature: number; topP: number; frequencyPenalty: number; presencePenalty: number } {
    const temperature = 0.1 + (this.state.position + 1) / 2 * 1.1
    const topP = 0.7 + (1 - Math.abs(this.state.position)) * 0.25
    const frequencyPenalty = 0.2 + (1 - this.state.coherence) * 0.5
    const presencePenalty = 0.2 + (1 - this.state.entropy) * 0.5
    return { temperature, topP, frequencyPenalty, presencePenalty }
  }

  getState(): PendulumState {
    return { ...this.state }
  }

  getThinkingDepth(): number {
    return this.state.thinkingDepth
  }

  getCoherence(): number {
    return this.state.coherence
  }

  getReasoningEffort(): 'low' | 'medium' | 'high' | 'max' {
    return this.state.reasoningEffort
  }

  // Memory helpers
  getMemory(): string[] {
    return [...this.state.memory]
  }

  getLastImagePrompt(): string | undefined {
    return this.state.lastImagePrompt
  }

  getLastVideoPrompt(): string | undefined {
    return this.state.lastVideoPrompt
  }

  // Check if we should ask clarifying questions
  shouldAskQuestion(query: string): boolean {
    if (query.split(' ').length < 4) return true
    if (this.isAmbiguousQuery(query) && this.state.entropy > 0.6) return true
    if (this.isTechnicalQuery(query) && this.isComplexQuery(query)) return true
    // If there are many queries in memory, we may need more context
    if (this.state.memory.length > 10 && this.state.totalQueries > 5) return false
    return false
  }

  generateClarifyingQuestions(query: string): string[] {
    const questions: string[] = []
    if (query.split(' ').length < 4) {
      questions.push('Could you provide more context or details about your request?')
    }
    if (this.isAmbiguousQuery(query)) {
      questions.push('What specific outcome are you looking for?')
      questions.push('Are there any constraints or preferences I should consider?')
    }
    if (this.isTechnicalQuery(query)) {
      questions.push('Which technologies or platforms are you using?')
      questions.push('Do you have any specific requirements or limitations?')
    }
    if (questions.length === 0) {
      questions.push('To give you the best answer, could you clarify your main goal?')
    }
    return questions
  }

  // Reset memory (for privacy or new session)
  resetMemory(): void {
    this.state.memory = []
    this.state.totalQueries = 0
    this.state.imageCount = 0
    this.state.videoCount = 0
    this.state.lastImagePrompt = undefined
    this.state.lastVideoPrompt = undefined
  }
}
