export const SLMPrompts = {
  searchStrategy: (query: string): string => `
You are a lead generation strategist. Given a user's query, generate:
- 3‑5 search keywords (comma separated)
- Target industries (comma separated)
- Target regions (comma separated)

User query: "${query}"

Return ONLY valid JSON:
{
  "keywords": ["keyword1", "keyword2", ...],
  "industries": ["industry1", "industry2", ...],
  "regions": ["region1", "region2", ...]
}`,

  extractContact: (text: string): string => `
Extract contact information from the following text.
Return ONLY valid JSON with these fields: name, email, phone, company, jobTitle, linkedinUrl, twitterUrl, city, country.
If a field is missing, use null.

Text: ${text.slice(0, 4000)}

JSON:`,

  validateLead: (contact: Record<string, unknown>): string => `
Validate the following lead data. Return JSON: { "valid": true/false, "confidence": 0-1 }
Data: ${JSON.stringify(contact)}
Rules: valid if email or phone exists. Confidence based on data completeness.`,

  detectIntent: (message: string): string => `
Classify the user's message intent. Choose ONE:
- "lead_generation": if the user wants to find leads, contacts, or search for people
- "general": for any other conversation

Message: "${message}"

Return ONLY valid JSON: { "intent": "lead_generation" | "general" }`,
}
