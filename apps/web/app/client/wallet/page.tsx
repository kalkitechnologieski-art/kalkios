// == KALKI B4 EXPERIENCE ==
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useAuth';
import Link from 'next/link';
import { Wallet, ArrowLeft } from 'lucide-react';

interface Reward {
  id: string;
  amount: number;
  reward_type: string;
  status: string;
  created_at: string;
  expires_at: string | null;
}

export default function WalletPage() {
  const { user, loading: authLoading } = useUser();
  const [balance, setBalance] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    void (async () => {
      try {
        const [{ data: prof }, { data: rewardsData }] = await Promise.all([
          supabase.from('profiles').select('wallet_balance').eq('id', user.id).single(),
          supabase
            .from('referral_rewards')
            .select('id, amount, reward_type, status, created_at, expires_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100),
        ]);
        setBalance((prof as { wallet_balance: number } | null)?.wallet_balance ?? 0);
        setRewards((rewardsData ?? []) as Reward[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (authLoading || loading) return <div className="text-white/40 text-center py-20">Loading…</div>;
  if (!user) return <div className="text-center py-20"><Link href="/login" className="text-cyan-400">Sign in</Link></div>;

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <Link href="/client" className="inline-flex items-center gap-2 text-cyan-400/60 hover:text-cyan-400 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-gradient-to-br from-green-600/10 to-cyan-600/10 border border-green-500/20 rounded-xl p-6 text-center">
        <Wallet className="w-8 h-8 text-green-400 mx-auto mb-2" />
        <p className="text-white/40 text-xs font-mono uppercase tracking-wider">Available balance</p>
        <p className="text-4xl font-bold text-white font-mono mt-1">₹{balance.toLocaleString('en-IN')}</p>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-3">Transaction history</h2>
        {rewards.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">No transactions yet.</p>
        ) : (
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl divide-y divide-white/5">
            {rewards.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-white text-sm capitalize">{r.reward_type} reward</p>
                  <p className="text-white/40 text-xs">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-mono font-bold">+₹{r.amount.toLocaleString('en-IN')}</p>
                  <p className="text-white/30 text-[10px] uppercase">{r.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
