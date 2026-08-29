import { chat } from './index'

export interface SocraticQuestion {
  type: 'clarification' | 'exploration' | 'challenge' | 'synthesis'
  question: string
  purpose: string
}

export class SocraticDeepen {
  private static instance: SocraticDeepen

  static getInstance(): SocraticDeepen {
    if (!SocraticDeepen.instance) {
      SocraticDeepen.instance = new SocraticDeepen()
    }
    return SocraticDeepen.instance
  }

  async generateQuestions(topic: string, depth: number = 3): Promise<SocraticQuestion[]> {
    const questions: SocraticQuestion[] = []
    questions.push({
      type: 'clarification',
      question: `What specific aspect of "${topic}" are you most interested in?`,
      purpose: 'Narrow down the focus',
    })
    questions.push({
      type: 'exploration',
      question: `What assumptions are you making about "${topic}" that we should examine?`,
      purpose: 'Uncover hidden assumptions',
    })
    if (depth >= 2) {
      questions.push({
        type: 'exploration',
        question: `How does "${topic}" relate to your overall business goals?`,
        purpose: 'Connect to broader context',
      })
    }
    if (depth >= 3) {
      questions.push({
        type: 'challenge',
        question: `What evidence would change your mind about "${topic}"?`,
        purpose: 'Test conviction',
      })
      questions.push({
        type: 'synthesis',
        question: `How would you explain "${topic}" to a complete beginner?`,
        purpose: 'Synthesize understanding',
      })
    }
    return questions
  }

  async deepenAnswer(originalPrompt: string, answers: string[], questions: SocraticQuestion[]): Promise<string> {
    const deepenPrompt = `
You are Siddhi, using the Socratic method to deepen understanding.

Original query: ${originalPrompt}

Previous answers provided: ${answers.join('\n')}

Socratic questions asked: ${questions.map(q => `- ${q.question} (${q.purpose})`).join('\n')}

Based on this exploration, provide a comprehensive, deeply reasoned answer that:
1. Synthesizes all perspectives
2. Addresses the core question
3. Provides actionable insights
4. Acknowledges limitations or open questions
`
    const response = await chat([
      { role: 'system', content: 'You are Siddhi, an expert at deep reasoning using the Socratic method.' },
      { role: 'user', content: deepenPrompt }
    ])
    return response.content
  }
}
