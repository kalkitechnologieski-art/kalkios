export async function validateLead(contact: any): Promise<{
  valid: boolean
  confidence: number
  cleaned: any
}> {
  const hasContact = !!(contact.email || contact.phone)
  if (!hasContact) {
    return { valid: false, confidence: 0, cleaned: {} }
  }

  const cleaned = {
    email: contact.email?.trim().toLowerCase() || null,
    phone: contact.phone?.trim() || null,
    name: contact.name?.trim() || null,
    company: contact.company?.trim() || null,
    jobTitle: contact.jobTitle?.trim() || null,
    linkedinUrl: contact.linkedinUrl?.trim() || null,
    twitterUrl: contact.twitterUrl?.trim() || null,
    city: contact.city?.trim() || null,
    country: contact.country?.trim() || null,
  }

  let confidence = 0.3
  if (cleaned.email) confidence += 0.3
  if (cleaned.phone) confidence += 0.2
  if (cleaned.name) confidence += 0.2
  if (cleaned.company) confidence += 0.1
  if (cleaned.linkedinUrl) confidence += 0.1

  return {
    valid: true,
    confidence: Math.min(confidence, 1),
    cleaned,
  }
}
