import { CircuitBreaker } from "./circuit-breaker";

export async function withRetry<T>(
  fn: () => Promise<T>,
  provider: string,
  circuitBreaker: CircuitBreaker,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;
  let delay = 500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      circuitBreaker.recordSuccess(provider);
      return result;
    } catch (error) {
      lastError = error as Error;
      circuitBreaker.recordFailure(provider);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        delay *= 2;
      }
    }
  }
  throw lastError || new Error(`All retries failed for ${provider}`);
}
