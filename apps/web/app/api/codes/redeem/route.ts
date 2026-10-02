// Mark a code as redeemed after payment confirmed.
// Server-side only: verified session must own the paid order; the discount
// comes from the order record (never the client) and usage increments through
// the atomic redeem_code() RPC.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { normalizeCode } from '@/lib/referral/codegen';
import { logger } from '@/lib/utils/logger';
import { verifySession, isResponse, rateLimit } from '@/lib/security/api-guards';

export async function POST(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;

  const limit = rateLimit(`codes-redeem:${user.id}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  try {
    const { code, orderId } = (await req.json()) as { code: string; orderId: string };
    if (!code || !orderId) {
      return NextResponse.json({ error: 'code and orderId required' }, { status: 400 });
    }

    // Supabase cast to `any` — generated types predate the redeem_code RPC.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: order } = await supabase
      .from('orders')
      .select('id, client_id, status, code_id, discount_amount')
      .eq('id', orderId)
      .single();

    if (!order || order.client_id !== user.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'paid') {
      return NextResponse.json({ error: 'Order not paid' }, { status: 400 });
    }

    const normalized = normalizeCode(code);
    const { data: codeRow } = await supabase
      .from('codes')
      .select('id')
      .ilike('code', normalized)
      .single();

    if (!codeRow?.id) {
      return NextResponse.json({ error: 'Code not found' }, { status: 404 });
    }

    // The code attached at checkout is the one that was actually honored.
    if (order.code_id && order.code_id !== codeRow.id) {
      return NextResponse.json({ error: 'Code was not used for this order' }, { status: 400 });
    }

    const { error: redeemError } = await supabase.rpc('redeem_code', {
      p_code_id: codeRow.id,
      p_user_id: user.id,
      p_order_id: orderId,
      p_discount: order.discount_amount ?? 0,
    });

    if (redeemError) {
      const msg = redeemError.message ?? '';
      if (msg.includes('duplicate key')) {
        return NextResponse.json({ error: 'Already redeemed' }, { status: 409 });
      }
      if (msg.includes('exhausted') || msg.includes('not active') || msg.includes('user limit')) {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      logger.error('[Codes] Redeem RPC failed', redeemError);
      return NextResponse.json({ error: 'Redeem failed' }, { status: 500 });
    }

    logger.info('[Codes] Redeemed', { code: normalized, orderId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Codes] Redeem failed', error);
    return NextResponse.json({ error: 'Redeem failed' }, { status: 500 });
  }
}
