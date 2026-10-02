// == KALKI B5 LAUNCH ==
// Extract a clean 40-word summary from long-form content.
// Used to emit GEO-friendly definitional sentences.
// -----------------------------------------------------------------------------

export function extractSummary(text: string, maxWords = 40): string {
  if (!text) return '';
  const clean = text.replace(/[#*_`>\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let out = '';
  let count = 0;
  for (const s of sentences) {
    const words = s.split(/\s+/);
    if (count + words.length > maxWords) break;
    out += (out ? ' ' : '') + s;
    count += words.length;
  }
  if (!out) {
    out = clean.split(/\s+/).slice(0, maxWords).join(' ');
  }
  return out.trim();
}

export function extractKeyFacts(text: string, max = 5): string[] {
  if (!text) return [];
  const clean = text.replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').trim();
  const sentences = clean.split(/(?<=[.!?])\s+/);
  return sentences
    .filter((s) => /\d/.test(s) || /₹|\$|%/.test(s))
    .slice(0, max)
    .map((s) => s.trim());
}
