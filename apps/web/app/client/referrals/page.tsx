// == KALKI B4 EXPERIENCE ==
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useAuth';
import Link from 'next/link';
import { Gift, Copy, Check, ArrowLeft, Share2 } from 'lucide-react';
import { LuxuryButton } from '@/components/ui/LuxuryButton';

export default function ReferralsPage() {
  const { user, loading: authLoading } = useUser();
  const [code, setCode] = useState('KALKI-XXXX');
  const [referrals, setReferrals] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    void supabase
      .from('profiles')
      .select('referral_code, total_referrals, total_referral_earnings')
      .eq('id', user.id)
      .single()
      .then(({ data }: { data: { referral_code?: string; total_referrals?: number; total_referral_earnings?: number } | null }) => {
        if (data?.referral_code) setCode(data.referral_code);
        setReferrals(data?.total_referrals ?? 0);
        setEarnings(data?.total_referral_earnings ?? 0);
      });
  }, [user]);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${code}`
    : `https://kalkios.com/?ref=${code}`;

  const copy = () => {
    void navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Join KALKI OS via my link: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (authLoading) return <div className="text-white/40 text-center py-20">Loading…</div>;
  if (!user) return <div className="text-center py-20"><Link href="/login" className="text-cyan-400">Sign in</Link></div>;

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <Link href="/client" className="inline-flex items-center gap-2 text-cyan-400/60 hover:text-cyan-400 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="text-center">
        <Gift className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-white">Refer & earn</h1>
        <p className="text-white/60 text-sm mt-1">Earn ₹500 for every friend who buys</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white font-mono">{referrals}</p>
          <p className="text-white/40 text-xs">Referrals</p>
        </div>
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400 font-mono">₹{earnings.toLocaleString('en-IN')}</p>
          <p className="text-white/40 text-xs">Total earned</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-600/10 to-cyan-600/10 border border-purple-500/20 rounded-xl p-5">
        <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-2">Your referral link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-cyan-300 text-xs font-mono overflow-hidden text-ellipsis whitespace-nowrap">
            {shareUrl}
          </code>
          <button onClick={copy} className="p-2 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-lg transition" aria-label="Copy link">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <LuxuryButton
            variant="cyber"
            size="default"
            label="Share on WhatsApp"
            icon={<Share2 className="w-4 h-4" />}
            onClick={shareWhatsApp}
            fullWidth
          />
        </div>
      </div>

      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
        <h2 className="text-white font-bold text-sm mb-3">How it works</h2>
        <ol className="space-y-2 text-sm text-white/60">
          <li className="flex gap-2"><span className="text-cyan-400 font-mono">1.</span> Share your link with friends</li>
          <li className="flex gap-2"><span className="text-cyan-400 font-mono">2.</span> Friend signs up and gets 20% off</li>
          <li className="flex gap-2"><span className="text-cyan-400 font-mono">3.</span> You earn ₹500 when they buy</li>
          <li className="flex gap-2"><span className="text-cyan-400 font-mono">4.</span> Redeem in your wallet at checkout</li>
        </ol>
      </div>
    </div>
  );
}
