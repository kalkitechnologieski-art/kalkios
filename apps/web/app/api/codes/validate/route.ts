// == KALKI B2 ENGINES ==
// Validate a code against the current order.
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateCode } from '@/lib/codes/validate';
import { normalizeCode } from '@/lib/referral/codegen';
import { verifySession, isResponse, rateLimit, clientKey } from '@/lib/security/api-guards';

export async function POST(req: NextRequest) {
  // Guests may preview a code; the session (if any) is still checked server-side
  // at payment time. Rate-limit both paths so codes can't be enumerated.
  const user = await verifySession(req);
  const scope = isResponse(user) ? clientKey(req, 'codes-validate') : `codes-validate:${user.id}`;
  const limit = rateLimit(scope, 15, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { valid: false, reason: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  try {
    const { code, orderAmount } = (await req.json()) as { code: string; orderAmount: number };
    if (!code || typeof orderAmount !== 'number' || orderAmount < 0) {
      return NextResponse.json({ valid: false, reason: 'Missing code or amount' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user as { id: string; email?: string } | null;

    const { data: codeRow } = await supabase
      .from('codes')
      .select('*')
      .ilike('code', normalizeCode(code))
      .single();

    if (!codeRow) {
      return NextResponse.json({ valid: false, reason: 'Invalid code' });
    }

    const result = validateCode(codeRow, {
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      userRole: null,
      orderAmount,
      serviceIds: [],
      serviceCategories: [],
      isFirstOrder: false,
      userCreatedAt: null,
      appliedCodeIds: [],
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, reason: 'Validation failed' }, { status: 500 });
  }
}
