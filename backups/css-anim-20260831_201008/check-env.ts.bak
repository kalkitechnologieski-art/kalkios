/**
 * Validates required environment variables for AI services.
 * Returns a list of missing keys.
 */
export function validateAIEnv(): string[] {
  const required = ['AGNES_API_KEY', 'ZHIPU_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY']
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    console.warn(`⚠️ Missing AI API keys: ${missing.join(', ')}`)
  }
  return missing
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
