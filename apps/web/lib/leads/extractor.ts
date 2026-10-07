// ── Regex patterns ──
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/|pub\/|company\/)[a-zA-Z0-9_-]+/g
const TWITTER_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+/g
const FACEBOOK_REGEX = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[a-zA-Z0-9._-]+/g
const INSTAGRAM_REGEX = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9._]+/g
const MAILTO_REGEX = /href\s*=\s*["']mailto:([^"'?]+)/gi
const TEL_REGEX = /href\s*=\s*["']tel:([^"'+]+)/gi

// ── Person/Organization structured data ──
const TITLE_TAGS_REGEX = /<title>([^<]{2,160})<\/title>/i
const META_DESCRIPTION_REGEX = /<meta\s+(?:name|property)=["'](?:description|og:description)["']\s+content=["']([^"']{4,400})["']/i
const H1_REGEX = /<h1[^>]*>([^<]{2,160})<\/h1>/gi
const H2_REGEX = /<h2[^>]*>([^<]{2,160})<\/h2>/gi
const JSONLD_REGEX = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

const JOB_TITLE_HINTS = /\b(ceo|founder|co-?founder|cto|coo|cfo|cmo|vp|director|head of|chief|manager|engineer|developer|architect|lead|owner|principal|partner|consultant|designer|analyst|researcher|scientist|officer|president|chairman|marketer|sales|recruiter|advisor)\b/i
const US_STATE_REGEX = /\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/

interface ParsedJsonLd {
  '@type'?: string | string[]
  '@graph'?: unknown[]
  type?: string
  name?: string
  email?: string
  telephone?: string
  jobTitle?: string
  worksFor?: string | { name?: string }
  address?: string | {
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
  url?: string
  sameAs?: string[]
}

function normalizeEmail(email: string | null): string | null {
  if (!email) return null
  return email.trim().toLowerCase()
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, '').trim()
}

function isBusinessEmail(email: string | null): boolean {
  if (!email) return false
  const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'protonmail.com', 'mail.com', 'gmx.com', 'zoho.com', 'yandex.com', 'proton.me']
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? !freeProviders.includes(domain) : false
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function looksLikePersonName(value: string): boolean {
  if (!value) return false
  const cleaned = value.trim()
  if (cleaned.length < 3 || cleaned.length > 80) return false
  if (cleaned.includes('@') || cleaned.includes('http')) return false
  if (JOB_TITLE_HINTS.test(cleaned)) return false
  // Heuristic: 2-4 word strings, mostly alphabetic
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 4) return false
  return /^[A-Z][a-zA-Z'’.-]+(?:\s+[A-Z][a-zA-Z'’.-]+){1,3}$/.test(cleaned)
}

function looksLikeJobTitle(value: string): boolean {
  if (!value) return false
  return JOB_TITLE_HINTS.test(value) && value.length <= 80
}

interface HarvestedExtras {
  names: string[]
  jobTitles: string[]
  cities: string[]
  countries: string[]
  orgNames: string[]
}

function harvestStructuredExtras(html: string): HarvestedExtras {
  const names: string[] = []
  const jobTitles: string[] = []
  const cities: string[] = []
  const countries: string[] = []
  const orgNames: string[] = []

  // JSON-LD blocks
  const jsonMatches = Array.from(html.matchAll(JSONLD_REGEX))
  for (const m of jsonMatches) {
    const raw = m[1]?.trim()
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as ParsedJsonLd | ParsedJsonLd[]
      const blocks = Array.isArray(parsed) ? parsed : [parsed]
      const collect = (block: ParsedJsonLd) => {
        if (block['@graph'] && Array.isArray(block['@graph'])) {
          for (const child of block['@graph']) collect(child as ParsedJsonLd)
        }
        const type = block['@type'] ?? block.type
        const typeStr = Array.isArray(type) ? type.join(' ') : (type ?? '')
        if (/Person/i.test(typeStr) && typeof block.name === 'string') names.push(block.name)
        if (/Organization/i.test(typeStr) && typeof block.name === 'string') orgNames.push(block.name)
        if (typeof block.jobTitle === 'string') jobTitles.push(block.jobTitle)
        if (typeof block.worksFor === 'string') orgNames.push(block.worksFor)
        else if (block.worksFor && typeof block.worksFor === 'object' && typeof block.worksFor.name === 'string') orgNames.push(block.worksFor.name)
        if (block.address && typeof block.address === 'object') {
          if (block.address.addressLocality) cities.push(block.address.addressLocality)
          if (typeof block.address.addressCountry === 'string') countries.push(block.address.addressCountry)
        } else if (typeof block.address === 'string') {
          cities.push(block.address)
        }
      }
      for (const b of blocks) collect(b)
    } catch {
      // malformed JSON-LD, skip
    }
  }

  // Headings: pull names from H2 (often "Team", "About Us"), H1 page title
  const h1Matches = Array.from(html.matchAll(H1_REGEX)).slice(0, 1)
  for (const m of h1Matches) {
    const text = stripTags(m[1] ?? '')
    if (looksLikePersonName(text)) names.push(text)
    else if (looksLikeJobTitle(text)) jobTitles.push(text)
    else if (text.length > 2) orgNames.push(text)
  }
  const h2Matches = Array.from(html.matchAll(H2_REGEX)).slice(0, 8)
  for (const m of h2Matches) {
    const text = stripTags(m[1] ?? '')
    if (looksLikeJobTitle(text)) jobTitles.push(text)
    else if (looksLikePersonName(text)) names.push(text)
  }

  // <title> fallback for company/organization
  const titleMatch = html.match(TITLE_TAGS_REGEX)
  if (titleMatch?.[1]) {
    const title = stripTags(titleMatch[1])
    const cleaned = title.split(/[|·•\-–—]/)[0]?.trim() ?? ''
    if (cleaned.length >= 2 && cleaned.length <= 80 && !looksLikeJobTitle(cleaned)) orgNames.push(cleaned)
  }

  return {
    names: [...new Set(names)].slice(0, 5),
    jobTitles: [...new Set(jobTitles)].slice(0, 5),
    cities: [...new Set(cities)].slice(0, 3),
    countries: [...new Set(countries)].slice(0, 3),
    orgNames: [...new Set(orgNames)].slice(0, 5),
  }
}

function extractBasicData(html: string, url: string) {
  const seenEmail = new Set<string>()
  const collectEmails = (matches: RegExpMatchArray | null) => {
    for (const raw of matches ?? []) {
      const normalized = normalizeEmail(raw)
      if (!normalized) continue
      if (normalized.includes('.jpg') || normalized.includes('.png') || normalized.includes('.css')) continue
      if (normalized.includes('example.com') || normalized.includes('yourcompany')) continue
      seenEmail.add(normalized)
    }
  }
  collectEmails(html.match(EMAIL_REGEX))
  for (const m of html.matchAll(MAILTO_REGEX)) {
    const decoded = decodeURIComponent(m[1] ?? '').trim()
    const normalized = normalizeEmail(decoded.split('?')[0])
    if (normalized) seenEmail.add(normalized)
  }
  const emails = [...seenEmail]

  const seenPhone = new Set<string>()
  for (const raw of html.match(PHONE_REGEX) ?? []) seenPhone.add(normalizePhone(raw))
  for (const m of html.matchAll(TEL_REGEX)) {
    const decoded = decodeURIComponent(m[1] ?? '').trim()
    if (decoded) seenPhone.add(normalizePhone(decoded))
  }
  const phones = [...seenPhone].filter((p) => p.replace(/\D/g, '').length >= 7)

  const linkedinUrls = [...new Set(html.match(LINKEDIN_REGEX) || [])]
  const twitterUrls = [...new Set(html.match(TWITTER_REGEX) || [])]
  const facebookUrls = [...new Set(html.match(FACEBOOK_REGEX) || [])]
  const instagramUrls = [...new Set(html.match(INSTAGRAM_REGEX) || [])]

  const domain = (() => {
    try { return new URL(url).hostname.replace(/^www\./, '') }
    catch { return '' }
  })()
  let company = domain.split('.')[0] || ''
  if (company) company = company.charAt(0).toUpperCase() + company.slice(1)

  const extras = harvestStructuredExtras(html)

  // Organization from JSON-LD beats domain guess
  if (extras.orgNames.length > 0) company = extras.orgNames[0]!

  return {
    emails,
    phones,
    linkedinUrls,
    twitterUrls,
    facebookUrls,
    instagramUrls,
    email: emails.length > 0 ? emails[0] : null,
    phone: phones.length > 0 ? phones[0] : null,
    linkedinUrl: linkedinUrls.length > 0 ? linkedinUrls[0] : null,
    twitterUrl: twitterUrls.length > 0 ? twitterUrls[0] : null,
    facebookUrl: facebookUrls.length > 0 ? facebookUrls[0] : null,
    instagramUrl: instagramUrls.length > 0 ? instagramUrls[0] : null,
    company: company || null,
    names: extras.names,
    jobTitles: extras.jobTitles,
    cities: extras.cities,
    countries: extras.countries,
    metaDescription: html.match(META_DESCRIPTION_REGEX)?.[1] ?? null,
  }
}

function scoreContact(contact: any): number {
  let score = 0
  if (contact.email) score += 30
  if (contact.phone) score += 20
  if (contact.company) score += 15
  if (contact.linkedinUrl) score += 10
  if (contact.twitterUrl) score += 5
  if (contact.facebookUrl) score += 4
  if (contact.instagramUrl) score += 3
  if (contact.name && contact.name.length > 2) score += 10
  if (contact.jobTitle) score += 10
  if (contact.email && isBusinessEmail(contact.email)) score += 15
  if (contact.city) score += 5
  if (contact.country) score += 3
  if (contact.metaDescription) score += 4
  // Structured data is more reliable than raw regex matches
  if (contact.source === 'structured_data') score += 10
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
    facebookUrl: a.facebookUrl ?? b.facebookUrl ?? null,
    instagramUrl: a.instagramUrl ?? b.instagramUrl ?? null,
    city: a.city ?? b.city ?? null,
    country: a.country ?? b.country ?? null,
    metaDescription: a.metaDescription ?? b.metaDescription ?? null,
    source: a.source ?? b.source ?? null,
    confidence: Math.max(a.confidence || 0, b.confidence || 0),
  }
}

function deduplicateContacts(contacts: any[]): any[] {
  const byEmail = new Map<string, any>()
  const byPhone = new Map<string, any>()
  const withoutAnchor: any[] = []

  for (const contact of contacts) {
    let key: string | null = null
    let bucket: Map<string, any> | null = null
    if (contact.email) { key = normalizeEmail(contact.email) ?? ''; bucket = byEmail }
    else if (contact.phone) { key = contact.phone; bucket = byPhone }

    if (bucket && key) {
      const existing = bucket.get(key)
      if (existing) bucket.set(key, mergeContacts(existing, contact))
      else bucket.set(key, { ...contact })
    } else {
      withoutAnchor.push(contact)
    }
  }

  return [
    ...Array.from(byEmail.values()),
    ...Array.from(byPhone.values()),
    ...withoutAnchor,
  ].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
}

export async function extractContactData(html: string, url: string): Promise<any[]> {
  const basic = extractBasicData(html, url)

  if (basic.emails.length === 0 && basic.phones.length === 0) return []

  const contacts: any[] = []

  // Build one contact per email — most reliable anchor
  for (const email of basic.emails) {
    contacts.push({
      name: basic.names[0] ?? null,
      email,
      phone: basic.phone ?? null,
      company: basic.company ?? null,
      jobTitle: basic.jobTitles[0] ?? null,
      linkedinUrl: basic.linkedinUrl ?? null,
      twitterUrl: basic.twitterUrl ?? null,
      facebookUrl: basic.facebookUrl ?? null,
      instagramUrl: basic.instagramUrl ?? null,
      city: basic.cities[0] ?? null,
      country: basic.countries[0] ?? null,
      metaDescription: basic.metaDescription ?? null,
      source: basic.names.length > 0 ? 'structured_data' : 'regex',
      confidence: 0.6,
    })
  }

  // Fallback: phone-only contact if we have no emails
  if (basic.emails.length === 0 && basic.phones.length > 0) {
    contacts.push({
      name: basic.names[0] ?? null,
      email: null,
      phone: basic.phones[0] ?? null,
      company: basic.company ?? null,
      jobTitle: basic.jobTitles[0] ?? null,
      linkedinUrl: basic.linkedinUrl ?? null,
      twitterUrl: basic.twitterUrl ?? null,
      facebookUrl: basic.facebookUrl ?? null,
      instagramUrl: basic.instagramUrl ?? null,
      city: basic.cities[0] ?? null,
      country: basic.countries[0] ?? null,
      metaDescription: basic.metaDescription ?? null,
      source: basic.names.length > 0 ? 'structured_data' : 'regex',
      confidence: 0.3,
    })
  }

  const deduped = deduplicateContacts(contacts)
  return deduped.map((c) => ({
    ...c,
    confidence: scoreContact(c) / 100,
  }))
}