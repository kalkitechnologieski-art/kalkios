// == KALKI B2 ENGINES ==
// Generate referral code for an authenticated user (idempotent).
// -----------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateReferralCode } from '@/lib/referral/codegen';
import { logger } from '@/lib/utils/logger';

export async function POST() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user as { id: string } | null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    if (profile?.referral_code) {
      return NextResponse.json({ code: profile.referral_code });
    }

    const code = generateReferralCode();
    await supabase.from('profiles').update({ referral_code: code }).eq('id', user.id);

    logger.info('[Referral] Generated code', { userId: user.id });
    return NextResponse.json({ code });
  } catch (error) {
    logger.error('[Referral] Generate failed', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
