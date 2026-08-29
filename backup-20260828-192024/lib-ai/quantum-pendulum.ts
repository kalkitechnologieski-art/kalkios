export enum CognitiveAxis {
  RATIONAL_INTUITIVE = 'rational_intuitive',
  ANALYTICAL_SYNTHESIZING = 'analytical_synthesizing',
  CONVERGENT_DIVERGENT = 'convergent_divergent',
}

export interface PendulumState {
  axis: CognitiveAxis
  position: number
  amplitude: number
  frequency: number
  entropy: number
  coherence: number
  thinkingDepth: number
}

export class QuantumPendulum {
  private state: PendulumState
  private lastUpdate: number

  constructor() {
    this.state = {
      axis: CognitiveAxis.RATIONAL_INTUITIVE,
      position: 0,
      amplitude: 0.7,
      frequency: 0.7,
      entropy: 0.42,
      coherence: 0.87,
      thinkingDepth: 0.5,
    }
    // Lazy initialization: Date.now() is only called when update() is first used
    // This avoids the prerender error because it's not called during build
    this.lastUpdate = 0
  }

  private getNow(): number {
    if (this.lastUpdate === 0) {
      this.lastUpdate = Date.now()
    }
    return this.lastUpdate
  }

  update(query: string): void {
    const now = Date.now()
    const delta = (now - this.getNow()) / 1000
    this.lastUpdate = now

    const oscillation = Math.sin(2 * Math.PI * this.state.frequency * delta)
    this.state.position += oscillation * this.state.amplitude * 0.1
    this.state.position = Math.max(-1, Math.min(1, this.state.position))

    if (this.isTechnicalQuery(query)) {
      this.state.axis = CognitiveAxis.RATIONAL_INTUITIVE
      this.state.position = Math.max(this.state.position - 0.15, -1)
      this.state.thinkingDepth = 0.8
    }

    if (this.isCreativeQuery(query)) {
      this.state.axis = CognitiveAxis.CONVERGENT_DIVERGENT
      this.state.position = Math.min(this.state.position + 0.15, 1)
      this.state.thinkingDepth = 0.6
    }

    if (this.isComplexQuery(query)) {
      this.state.thinkingDepth = 0.9
      this.state.entropy = 0.5
    }

    this.state.entropy = 0.3 + 0.4 * (1 - Math.abs(this.state.position))
    this.state.coherence = 0.9 - 0.3 * this.state.entropy
  }

  private isTechnicalQuery(query: string): boolean {
    const terms = ['code', 'api', 'database', 'server', 'development', 'fix', 'build', 'deploy', 'architecture']
    return terms.some((t) => query.toLowerCase().includes(t))
  }

  private isCreativeQuery(query: string): boolean {
    const terms = ['design', 'creative', 'brand', 'story', 'visual', 'marketing', 'content', 'idea']
    return terms.some((t) => query.toLowerCase().includes(t))
  }

  private isComplexQuery(query: string): boolean {
    const terms = ['analyze', 'compare', 'evaluate', 'synthesize', 'optimize', 'strategy']
    return terms.some((t) => query.toLowerCase().includes(t)) || query.split(' ').length > 15
  }

  getModelParams(): { temperature: number; topP: number; frequencyPenalty: number } {
    const temperature = 0.1 + (this.state.position + 1) / 2 * 1.1
    const topP = 0.7 + (1 - Math.abs(this.state.position)) * 0.25
    const frequencyPenalty = 0.2 + (1 - this.state.coherence) * 0.5
    return { temperature, topP, frequencyPenalty }
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
}
