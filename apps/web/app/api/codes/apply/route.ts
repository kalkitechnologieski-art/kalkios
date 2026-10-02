// == KALKI B2 ENGINES ==
// Apply a set of codes to a set of cart line items.
// Returns the discount total so the client can update its summary.
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyDiscount, type DiscountableLine } from '@/lib/codes/apply';
import type { Code } from '@/lib/codes/types';
import { normalizeCode } from '@/lib/referral/codegen';
import { verifySession, isResponse, rateLimit } from '@/lib/security/api-guards';

interface ApplyBody {
  codes: string[];
  lineItems: DiscountableLine[];
}

export async function POST(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;

  const limit = rateLimit(`codes-apply:${user.id}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  try {
    const body = (await req.json()) as ApplyBody;
    const { codes, lineItems } = body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ error: 'No codes provided' }, { status: 400 });
    }
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: 'No line items provided' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;

    const { data: codeRows } = await supabase
      .from('codes')
      .select('*')
      .in('code', codes.map(normalizeCode))
      .eq('status', 'active');

    const typedRows = ((codeRows ?? []) as Code[]);
    const result = applyDiscount(lineItems, typedRows);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Apply failed' }, { status: 500 });
  }
}
