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
        this.failures[provider] = this.threshold - 1;
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(provider: string): void {
    if (this.failures[provider] && this.failures[provider] > 0) {
      this.failures[provider] = Math.max(0, this.failures[provider] - 1);
    }
  }

  recordFailure(provider: string): void {
    this.failures[provider] = (this.failures[provider] || 0) + 1;
    this.lastFailure[provider] = Date.now();
  }

  getStatus(provider: string) {
    return {
      isOpen: this.isOpen(provider),
      failures: this.failures[provider] || 0,
      lastFailure: this.lastFailure[provider] || null,
    };
  }
}
