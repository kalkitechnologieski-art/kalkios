export class Guardrails {
  detectPII(input: string): { found: boolean; types: string[] } {
    const patterns = {
      email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    };
    const found: string[] = [];
    for (const [type, regex] of Object.entries(patterns)) {
      if (regex.test(input)) found.push(type);
    }
    return { found: found.length > 0, types: found };
  }
  redactPII(input: string): string {
    return input.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
                .replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE REDACTED]');
  }
}
