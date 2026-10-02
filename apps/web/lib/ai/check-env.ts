/**
 * Validates required environment variables for AI services.
 * Throws when NO provider is configured — callers run in try/catch and
 * surface a 500 rather than silently invoking clients with missing keys.
 */
export function validateAIEnv(): string[] {
  const providers = getAvailableProviders()
  if (providers.length === 0) {
    throw new Error('No AI provider configured (set at least one of AGNES_API_KEY, ZHIPU_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY)')
  }
  return providers
}

/**
 * Gets the first available provider from the environment.
 */
export function getAvailableProviders(): string[] {
  const providers = []
  if (process.env.AGNES_API_KEY) providers.push('agnes')
  if (process.env.ZHIPU_API_KEY) providers.push('zhipu')
  if (process.env.GROQ_API_KEY) providers.push('groq')
  if (process.env.OPENROUTER_API_KEY) providers.push('openrouter')
  return providers
}
