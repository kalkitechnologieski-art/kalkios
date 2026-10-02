'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useAuth';
import Link from 'next/link';
import { FolderKanban, Wallet, Gift, Bell, ChevronRight, Plus, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  status: string;
  estimated_delivery: string | null;
}

interface TimelinePost {
  id: string;
  project_id: string | null;
  order_id: string | null;
  post_type: string;
  content: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface ProfileRow {
  wallet_balance: number | null;
  total_referrals: number | null;
  total_referral_earnings: number | null;
  referral_code: string | null;
}

export default function ClientDashboard() {
  const { user, loading: authLoading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [timelinePosts, setTimelinePosts] = useState<TimelinePost[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    void (async () => {
      try {
        const [{ data: p }, { data: prof }, { data: posts }] = await Promise.all([
          supabase
            .from('projects')
            .select('id, name, status, estimated_delivery')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('profiles')
            .select('wallet_balance, total_referrals, total_referral_earnings, referral_code')
            .eq('id', user.id)
            .single(),
          supabase
            .from('timeline_posts')
            .select('id, project_id, order_id, post_type, content, created_at, metadata')
            .eq('visibility', 'client')
            .in('project_id', projects.map(p => p.id))
            .order('created_at', { ascending: false })
            .limit(5),
        ]);
        setProjects((p ?? []) as Project[]);
        setProfile(prof as ProfileRow | null);
        setTimelinePosts((posts ?? []) as TimelinePost[]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <Skeleton variant="text" className="w-1/3 h-8 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-28" />
          ))}
        </div>
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Sign in to view your dashboard</h2>
        <Link href="/login">
          <Button variant="cyber" size="lg" label="Sign in" />
        </Link>
      </div>
    );
  }

  const wallet = profile?.wallet_balance ?? 0;
  const referrals = profile?.total_referrals ?? 0;
  const earnings = profile?.total_referral_earnings ?? 0;
  const code = profile?.referral_code ?? 'KALKI-XXXX';

  const activeProjects = projects.filter(p => !['completed', 'cancelled'].includes(p.status));
  const completedProjects = projects.filter(p => p.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold cyber-text">Client Dashboard</h1>
          <p className="text-white/60 text-sm mt-1">
            Welcome back, <span className="text-white font-medium">{user.email?.split('@')[0] ?? 'there'}</span>
          </p>
        </div>
        <Link href="/marketplace">
          <Button variant="cyber" size="lg" label="New project" icon={<Plus className="w-4 h-4" />} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban className="w-5 h-5 text-cyan-400" />}
          label="Active Projects"
          value={activeProjects.length}
          href="/client/orders"
          accent="cyan"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
          label="Completed"
          value={completedProjects.length}
          href="/client/orders?status=completed"
          accent="green"
        />
        <StatCard
          icon={<Wallet className="w-5 h-5 text-purple-400" />}
          label="Wallet"
          value={`₹${wallet.toLocaleString('en-IN')}`}
          href="/client/wallet"
          accent="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-yellow-400" />}
          label="Referral Earnings"
          value={`₹${earnings.toLocaleString('en-IN')}`}
          href="/client/referrals"
          accent="yellow"
        />
      </div>

      {/* Referral CTA */}
      <div className="glass-strong rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 neon-cyan">
        <div className="flex-1">
          <p className="text-white/60 text-xs font-mono uppercase tracking-wider">Your referral code</p>
          <p className="text-3xl font-bold cyber-text-glow font-mono mt-2">{code}</p>
          <p className="text-white/40 text-sm mt-1">Earn ₹500 for each friend who buys</p>
        </div>
        <Link href="/client/referrals">
          <Button variant="cyber" size="lg" label="Share & Earn" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent Projects</h2>
            <Link href="/client/orders" className="text-cyan-400 hover:text-cyan-300 text-sm">
              View all →
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center border border-cyan-500/10">
              <FolderKanban className="w-12 h-12 text-cyan-400/40 mx-auto mb-4" />
              <p className="text-white/60 text-sm mb-4">No active projects yet.</p>
              <Link href="/marketplace">
                <Button variant="outline" size="sm" label="Browse services" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/client/order/${p.id}`}
                  className="glass hover:border-cyan-500/30 rounded-xl p-4 transition group block"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{p.name}</p>
                      <p className="text-white/40 text-xs mt-1">
                        <StatusBadge status={p.status} /> · {p.estimated_delivery ? `Due ${new Date(p.estimated_delivery).toLocaleDateString()}` : 'In progress'}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Timeline Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Live Updates</h2>
            <Bell className="w-5 h-5 text-cyan-400" />
          </div>

          {timelinePosts.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center border border-cyan-500/10">
              <Clock className="w-10 h-10 text-cyan-400/40 mx-auto mb-3" />
              <p className="text-white/60 text-sm">No recent updates</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-hide">
              {timelinePosts.map((post) => (
                <div key={post.id} className="glass rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TimelineTypeIcon type={post.post_type} />
                    <span className="text-white/40 text-xs font-mono uppercase">{post.post_type}</span>
                  </div>
                  <p className="text-white/90 text-sm line-clamp-3">{post.content}</p>
                  <p className="text-white/30 text-xs mt-2">{timeAgo(post.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications strip */}
      <div className="glass rounded-xl p-4 flex items-center gap-3 border border-cyan-500/10">
        <Bell className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <p className="text-white/60 text-sm flex-1">Get notified when milestones complete or new updates arrive</p>
        <Link href="/settings/notifications" className="text-cyan-400 text-xs hover:text-cyan-300 whitespace-nowrap">
          Settings →
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  href: string;
  accent: 'cyan' | 'green' | 'purple' | 'yellow';
}) {
  const accentColors = {
    cyan: 'hover:border-cyan-500/30',
    green: 'hover:border-green-500/30',
    purple: 'hover:border-purple-500/30',
    yellow: 'hover:border-yellow-500/30',
  };

  return (
    <Link
      href={href}
      className={cn('glass rounded-xl p-4 transition block', accentColors[accent])}
    >
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-white/40 text-xs font-mono">{label}</span></div>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    in_progress: 'bg-cyan-500/20 text-cyan-400',
    review: 'bg-purple-500/20 text-purple-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  const labels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    review: 'Under Review',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', colors[status] || 'bg-white/10 text-white/60')}>
      {status === 'in_progress' && <Clock className="w-3 h-3" />}
      {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'pending' && <AlertCircle className="w-3 h-3" />}
      {labels[status] || status.replace('_', ' ')}
    </span>
  );
}

function TimelineTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    milestone: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    deliverable: <FolderKanban className="w-4 h-4 text-cyan-400" />,
    update: <Bell className="w-4 h-4 text-purple-400" />,
    question: <AlertCircle className="w-4 h-4 text-yellow-400" />,
    system: <Clock className="w-4 h-4 text-white/40" />,
  };

  return icons[type] || <Clock className="w-4 h-4 text-white/40" />;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
