// == KALKI B2 ENGINES ==
// Referral stats for the authenticated user.
// -----------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user as { id: string } | null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, total_referrals, total_referral_earnings, wallet_balance')
      .eq('id', user.id)
      .single();

    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('amount, status')
      .eq('user_id', user.id);

    const available = (rewards ?? [])
      .filter((r: { status: string }) => r.status === 'available')
      .reduce((s: number, r: { amount: number }) => s + r.amount, 0);
    const pending = (rewards ?? [])
      .filter((r: { status: string }) => r.status === 'pending')
      .reduce((s: number, r: { amount: number }) => s + r.amount, 0);

    return NextResponse.json({
      code: profile?.referral_code ?? null,
      total: profile?.total_referrals ?? 0,
      earned: profile?.total_referral_earnings ?? 0,
      available,
      pending,
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
