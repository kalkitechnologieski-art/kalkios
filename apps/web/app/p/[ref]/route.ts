// == KALKI CONFIDENTIAL PROPOSAL DELIVERY ==
// Serves self-contained, print-ready proposal documents at /p/<ref> — outside the app
// shell, so the browser print dialog produces the same A4 layout as the emailed PDF.
// The tokenised ref is the access grant; the page is never indexed or cached.
// -----------------------------------------------------------------------------

import { findProposal } from '@/lib/proposals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOC_HEADERS: Record<string, string> = {
  'content-type': 'text/html; charset=utf-8',
  'x-robots-tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  'cache-control': 'private, no-store, max-age=0',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
};

const NOT_FOUND = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Link unavailable · Kalki Intelligence</title>
<style>
  html,body{height:100%;margin:0}
  body{display:flex;align-items:center;justify-content:center;background:#05070d;color:#e6f3fa;
       font-family:"Segoe UI",system-ui,sans-serif;padding:24px}
  .box{max-width:420px;text-align:center;padding:30px 26px;border-radius:14px;
       background:linear-gradient(118deg,rgba(4,6,13,.9),rgba(21,14,43,.9));
       border:1px solid rgba(103,232,249,.22);box-shadow:0 22px 60px rgba(0,0,0,.55)}
  h1{font-size:19px;margin:0 0 9px;letter-spacing:.3px}
  p{font-size:13px;line-height:1.6;color:rgba(203,222,238,.78);margin:0 0 6px}
  a{color:#67e8f9;text-decoration:none}
  .mark{font-family:Consolas,monospace;font-size:11px;letter-spacing:4px;font-weight:800;margin-bottom:14px}
  .mark i{font-style:normal;background:linear-gradient(96deg,#67e8f9,#a855f7,#ec4899);
          -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
</style></head><body><div class="box">
  <div class="mark"><i>KALKI</i> INTELLIGENCE</div>
  <h1>This link is no longer available</h1>
  <p>Proposal links are private and expire. Ask for a fresh copy at
     <a href="mailto:ceo@kalki-intelligence.in">ceo@kalki-intelligence.in</a>.</p>
</div></body></html>`;

export async function GET(_req: Request, ctx: { params: Promise<{ ref: string }> }) {
  const { ref } = await ctx.params;
  const doc = findProposal(ref);

  if (!doc) {
    return new Response(NOT_FOUND, { status: 404, headers: DOC_HEADERS });
  }

  return new Response(doc.html, { status: 200, headers: DOC_HEADERS });
}
