// Re-syncs the served copy of a proposal from its master HTML file, keeping the
// published link stable (the tokenised ref is reused once it exists).
// Usage: node scripts/sync-proposal-doc.cjs
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'apps/web/lib/proposals/index.ts');

const DOCS = [
  {
    key: 'PANKAJ_ASTROLOGY_PROPOSAL',
    file: 'docs/proposal/pankaj-sharma-astrology-pwa-proposal.html',
    title: 'Proposal — Vedic Astrology & Occult Sciences AI Consultant Platform | KALKI Intelligence',
    refPrefix: 'pankaj-astrology-2026-',
  },
];

function existingRef(key) {
  if (!fs.existsSync(TARGET)) return null;
  const src = fs.readFileSync(TARGET, 'utf8');
  const block = src.split('export const ' + key + ': ProposalDoc = {')[1];
  if (!block) return null;
  const m = block.match(/ref:\s*'([^']+)'/);
  return m ? m[1] : null;
}

function escTemplate(html) {
  return html.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const bodies = DOCS.map((doc) => {
  const html = fs.readFileSync(path.join(ROOT, doc.file), 'utf8');
  const ref = existingRef(doc.key) || doc.refPrefix + crypto.randomBytes(4).toString('hex');
  return { doc, html, ref };
});

const out = `// == KALKI CONFIDENTIAL PROPOSALS ==
// Self-contained, print-ready documents served at /p/<ref> — outside the app shell, so the
// browser print dialog reproduces the A4 PDF. Holding the link is the access grant: the ref
// carries an unguessable token and the page is noindex and uncached.
// Generated from docs/proposal/*.html by scripts/sync-proposal-doc.cjs — edit the master, then re-run it.
// -----------------------------------------------------------------------------

export interface ProposalDoc {
  ref: string;
  title: string;
  html: string;
}

${bodies
  .map(
    (b) => `export const ${b.doc.key}: ProposalDoc = {
  ref: '${b.ref}',
  title: '${b.doc.title.replace(/'/g, "\\'")}',
  html: String.raw\`${b.html}\`,
};`
  )
  .join('\n\n')}

export const PROPOSALS: ProposalDoc[] = [${bodies.map((b) => b.doc.key).join(', ')}];

export function findProposal(ref: string): ProposalDoc | undefined {
  return PROPOSALS.find((p) => p.ref === ref);
}
`;

fs.writeFileSync(TARGET, out);
console.log(bodies.map((b) => b.doc.key + ' -> /p/' + b.ref).join('\n'));
