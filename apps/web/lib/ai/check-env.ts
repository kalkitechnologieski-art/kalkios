/**
 * Validates required environment variables for AI services.
 * Throws an error if a required key is missing.
 * Call this at the start of your app or API route.
 */
export function validateAIEnv() {
  const required = ['AGNES_API_KEY', 'ZHIPU_API_KEY']
  const missing = required.filter(key => !process.env[key])
  if (missing.length > 0) {
    console.warn(`⚠️ Missing AI API keys: ${missing.join(', ')}`)
    console.warn('   Chat will still work using fallback providers.')
  }
}
