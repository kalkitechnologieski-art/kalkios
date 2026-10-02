// Apply referral code during signup. Links referee to referrer.
// The referee is always the verified session user — never a client-supplied id.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { normalizeCode } from '@/lib/referral/codegen';
import { runFraudCheck, hashIp } from '@/lib/referral/guard';
import { logger } from '@/lib/utils/logger';
import { verifySession, isResponse, rateLimit } from '@/lib/security/api-guards';

export async function POST(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;

  const limit = rateLimit(`referral-apply:${user.id}`, 5, 24 * 60 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  try {
    const { code } = (await req.json()) as { code: string };
    if (!code) {
      return NextResponse.json({ error: 'code required' }, { status: 400 });
    }

    const refereeId = user.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: referrer } = await supabase
      .from('profiles')
      .select('id, referral_code')
      .ilike('referral_code', normalizeCode(code))
      .single();

    if (!referrer?.id) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }
    if (referrer.id === refereeId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('referral_events')
      .select('id')
      .eq('referee_id', refereeId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Referral already applied' }, { status: 409 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const ipHash = hashIp(ip);
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    const [{ count: recentEventsFromIp }, { count: userTotalReferrals }, refereeProfile] =
      await Promise.all([
        supabase
          .from('referral_events')
          .select('id', { count: 'exact', head: true })
          .eq('attribution_meta->>ip_hash', ipHash)
          .gte('created_at', dayStart.toISOString()),
        supabase
          .from('referral_events')
          .select('id', { count: 'exact', head: true })
          .eq('referrer_id', referrer.id)
          .gte('created_at', dayStart.toISOString()),
        supabase
          .from('profiles')
          .select('created_at, referred_by')
          .eq('id', refereeId)
          .maybeSingle(),
      ]);

    const check = runFraudCheck({
      referrerId: referrer.id,
      refereeId,
      refereeEmail: user.email ?? '',
      refereeIp: ip,
      recentEventsFromIp: recentEventsFromIp ?? 0,
      userTotalReferrals: userTotalReferrals ?? 0,
      maxPerDay: 5,
      alreadyConvertedBefore: Boolean(refereeProfile?.data?.referred_by),
    });

    // Shadowban: create event but mark as fraud
    const status = check.action === 'block' ? 'fraud' : 'pending';

    const { error: insertError } = await supabase.from('referral_events').insert({
      referrer_id: referrer.id,
      referee_id: refereeId,
      referral_code: normalizeCode(code),
      status,
      attribution_meta: { ip_hash: ipHash, action: check.action },
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Referral already applied' }, { status: 409 });
      }
      throw insertError;
    }

    await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', refereeId);

    logger.info('[Referral] Applied', { referrerId: referrer.id, refereeId, status });

    return NextResponse.json({
      success: true,
      status,
      shadowbanned: check.action === 'shadowban',
    });
  } catch (error) {
    logger.error('[Referral] Apply failed', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
