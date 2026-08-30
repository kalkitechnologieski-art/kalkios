export class CircuitBreaker {
  private failures: Record<string, number> = {};
  private lastFailure: Record<string, number> = {};
  private readonly threshold = 3;
  private readonly resetTimeout = 60000;

  isOpen(provider: string): boolean {
    const failures = this.failures[provider] || 0;
    const last = this.lastFailure[provider] || 0;
    if (failures >= this.threshold) {
      if (Date.now() - last > this.resetTimeout) {
        this.failures[provider] = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(provider: string) {
    this.failures[provider] = 0;
  }

  recordFailure(provider: string) {
    this.failures[provider] = (this.failures[provider] || 0) + 1;
    this.lastFailure[provider] = Date.now();
  }
}
