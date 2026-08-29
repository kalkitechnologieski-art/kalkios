import { QuantumPendulum } from './quantum-pendulum'
import { ChatMessage, ChatOptions, ChatResponse } from './types'
import { chat } from './index'
import { ensureString } from '@/lib/utils/string'

export interface DeepThinkResult {
  questions: string[]
  finalAnswer: string
  reasoning: string
  tokens: number
  provider: string
  iterations: number
}

export async function deepThink(
  messages: ChatMessage[],
  options: ChatOptions & { pendulum?: QuantumPendulum } = {}
): Promise<DeepThinkResult> {
  const pendulum = options.pendulum || new QuantumPendulum()
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()
  const query = lastUserMessage?.content || ''

  // Update pendulum with the query
  pendulum.update(query)

  let iterations = 0
  const maxIterations = 3
  let currentMessages = [...messages]
  let finalAnswer = ''
  let reasoning = ''
  let tokens = 0
  let provider = ''

  // Check if we need to ask clarifying questions
  if (pendulum.shouldAskQuestion(query)) {
    const questions = pendulum.generateClarifyingQuestions(query)
    return {
      questions,
      finalAnswer: '',
      reasoning: 'Need clarification',
      tokens: 0,
      provider: 'deep-think',
      iterations: 0,
    }
  }

  // Perform iterative reasoning with fallback chain
  let attempts = 0
  while (attempts < maxIterations) {
    attempts++
    iterations++

    // Get pendulum parameters
    const params = pendulum.getModelParams()
    const reasoningEffort = pendulum.getReasoningEffort()

    // Use Zhipu for deep thinking (primary)
    try {
      const response = await chat(currentMessages, {
        ...options,
        deep: true,
        reasoning_effort: reasoningEffort,
        // Spread params first, then override specific fields
        ...params,
        // Remove any temperature override if present
      })
      finalAnswer = response.content
      reasoning = response.reasoning || ''
      tokens = response.tokens
      provider = response.provider

      // Check if answer is satisfactory (simple heuristic)
      if (finalAnswer.length > 50 && !finalAnswer.includes('I need more information')) {
        break
      }
    } catch (error) {
      // Fallback to Agnes
      try {
        const response = await chat(currentMessages, {
          ...options,
          deep: false,
          // Spread params first
          ...params,
        })
        finalAnswer = response.content
        reasoning = response.reasoning || ''
        tokens = response.tokens
        provider = response.provider + '-fallback'
        break
      } catch (e2) {
        // Try Groq
        try {
          const response = await chat(currentMessages, {
            ...options,
            deep: false,
            // Spread params first
            ...params,
          })
          finalAnswer = response.content
          reasoning = response.reasoning || ''
          tokens = response.tokens
          provider = 'groq-final'
          break
        } catch (e3) {
          // Last resort
          finalAnswer = 'I apologize, I encountered an issue processing your request. Please try again.'
          reasoning = 'All providers failed'
          tokens = 0
          provider = 'error'
        }
      }
    }

    // If we still have no good answer, try to rephrase the question
    if (!finalAnswer || finalAnswer.length < 20) {
      const rephrasePrompt: ChatMessage[] = [
        { role: 'system', content: 'You are Siddhi. The user asked: "' + query + '". Please provide a clear, comprehensive answer to their question. If the question is ambiguous, ask for clarification.' },
        { role: 'user', content: query }
      ]
      currentMessages = rephrasePrompt
    } else {
      break
    }
  }

  return {
    questions: [],
    finalAnswer: ensureString(finalAnswer, 'No response generated.'),
    reasoning: ensureString(reasoning, ''),
    tokens,
    provider,
    iterations,
  }
}
