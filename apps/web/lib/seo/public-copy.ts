// Strip outcome promises the studio does not make. Applied to catalog text
// from the database so a stale row cannot outrank the on-page wording.

const REPLACEMENTS: Array<[RegExp, string]> = [
  [
    /rank\s*#\s*1\s+on\s+google\s+with\s+our\s+proven\s+strategy/gi,
    'Competitor analysis, on-page SEO, link building and monthly reporting. No ranking promise',
  ],
  [/rank\s*#\s*1\s+on\s+google/gi, 'search visibility work with no ranking promise'],
  [
    /guaranteed\s+viral\s+growth\s+across\s+instagram,\s+facebook,\s+and\s+youtube/gi,
    'Social content for Instagram, Facebook and YouTube, reported in writing. No view or viral guarantee',
  ],
  [/guaranteed\s+viral\s+growth/gi, 'content planned for sharing, with no view or viral guarantee'],
  [/10x your brand visibility within 90 days/gi, 'progress reported in writing, with no growth promise'],
  [/content that goes viral/gi, 'content that is meant to be shared'],
  [/viral video strategies/gi, 'short-form video plans'],
  [/viral video strategy/gi, 'short-form video plan'],
]

export function publicCopy(value: string | null | undefined): string {
  let text = String(value ?? '')
  for (const [pattern, replacement] of REPLACEMENTS) {
    text = text.replace(pattern, replacement)
  }
  return text.replace(/\s+/g, ' ').trim()
}
