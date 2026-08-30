export function validateLead(lead: any): boolean {
  return !!(lead.email || lead.phone || lead.name);
}

export function deduplicateLeads(leads: any[]): any[] {
  const seen = new Map<string, any>();
  for (const lead of leads) {
    const key = lead.email || lead.phone || lead.name || "unknown";
    if (!seen.has(key) || seen.get(key).confidence < lead.confidence) {
      seen.set(key, lead);
    }
  }
  return Array.from(seen.values());
}
