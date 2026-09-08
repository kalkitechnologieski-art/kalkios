// ── Regex patterns ──
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/g
const TWITTER_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/g

function normalizeEmail(email: string | null): string | null {
  if (!email) return null
  return email.trim().toLowerCase()
}

function isBusinessEmail(email: string | null): boolean {
  if (!email) return false
  const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com', 'gmx.com', 'zoho.com']
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? !freeProviders.includes(domain) : false
}

function extractBasicData(html: string, url: string) {
  const emails = [...new Set(html.match(EMAIL_REGEX) || [])]
    .map(normalizeEmail)
    .filter((e): e is string => e !== null)
    .filter(e => !e.includes('.jpg') && !e.includes('.png') && !e.includes('.css'))

  const phones = [...new Set(html.match(PHONE_REGEX) || [])]
  const linkedinUrls = [...new Set(html.match(LINKEDIN_REGEX) || [])]
  const twitterUrls = [...new Set(html.match(TWITTER_REGEX) || [])]

  let company = ''
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    company = domain.split('.')[0] || ''
    company = company.charAt(0).toUpperCase() + company.slice(1)
  } catch {}

  return {
    emails,
    phones,
    linkedinUrls,
    twitterUrls,
    email: emails.length > 0 ? emails[0] : null,
    phone: phones.length > 0 ? phones[0] : null,
    linkedinUrl: linkedinUrls.length > 0 ? linkedinUrls[0] : null,
    twitterUrl: twitterUrls.length > 0 ? twitterUrls[0] : null,
    company: company || null,
  }
}

function scoreContact(contact: any): number {
  let score = 0
  if (contact.email) score += 30
  if (contact.phone) score += 20
  if (contact.company) score += 15
  if (contact.linkedinUrl) score += 10
  if (contact.twitterUrl) score += 5
  if (contact.name && contact.name.length > 2) score += 10
  if (contact.jobTitle) score += 10
  if (contact.email && isBusinessEmail(contact.email)) score += 15
  return Math.min(score, 100)
}

function mergeContacts(a: any, b: any): any {
  return {
    name: a.name ?? b.name ?? null,
    email: a.email ?? b.email ?? null,
    phone: a.phone ?? b.phone ?? null,
    company: a.company ?? b.company ?? null,
    jobTitle: a.jobTitle ?? b.jobTitle ?? null,
    linkedinUrl: a.linkedinUrl ?? b.linkedinUrl ?? null,
    twitterUrl: a.twitterUrl ?? b.twitterUrl ?? null,
    city: a.city ?? b.city ?? null,
    country: a.country ?? b.country ?? null,
    confidence: Math.max(a.confidence || 0, b.confidence || 0),
  }
}

function deduplicateContacts(contacts: any[]): any[] {
  const byEmail = new Map<string, any>()
  const withoutEmail: any[] = []

  for (const contact of contacts) {
    if (contact.email) {
      const key = normalizeEmail(contact.email) || ''
      if (byEmail.has(key)) {
        const existing = byEmail.get(key)!
        byEmail.set(key, mergeContacts(existing, contact))
      } else {
        byEmail.set(key, { ...contact })
      }
    } else {
      withoutEmail.push(contact)
    }
  }

  return [
    ...Array.from(byEmail.values()),
    ...withoutEmail,
  ].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
}

export async function extractContactData(html: string, url: string): Promise<any[]> {
  const basic = extractBasicData(html, url)

  if (basic.emails.length === 0 && basic.phones.length === 0) return []

  const contacts: any[] = []

  for (const email of basic.emails) {
    contacts.push({
      name: null,
      email,
      phone: basic.phone ?? null,
      company: basic.company ?? null,
      jobTitle: null,
      linkedinUrl: basic.linkedinUrl ?? null,
      twitterUrl: basic.twitterUrl ?? null,
      city: null,
      country: null,
      confidence: 0.6,
    })
  }

  if (basic.emails.length === 0 && basic.phones.length > 0) {
    contacts.push({
      name: null,
      email: null,
      phone: basic.phones[0] ?? null,
      company: basic.company ?? null,
      jobTitle: null,
      linkedinUrl: basic.linkedinUrl ?? null,
      twitterUrl: basic.twitterUrl ?? null,
      city: null,
      country: null,
      confidence: 0.3,
    })
  }

  const deduped = deduplicateContacts(contacts)
  return deduped.map((c) => ({
    ...c,
    confidence: scoreContact(c) / 100,
  }))
}
