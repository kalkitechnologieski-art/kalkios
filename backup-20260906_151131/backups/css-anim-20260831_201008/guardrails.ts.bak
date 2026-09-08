export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, "").trim();
}

export function detectPII(input: string): { found: boolean; types: string[] } {
  const patterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    phone: /\b\d{10}\b/,
  };
  const foundTypes: string[] = [];
  if (patterns.email.test(input)) foundTypes.push("email");
  if (patterns.phone.test(input)) foundTypes.push("phone");
  return { found: foundTypes.length > 0, types: foundTypes };
}
