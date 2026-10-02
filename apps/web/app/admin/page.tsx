'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ShoppingBag, FileText, FolderKanban, TrendingUp, Tag, Gift, Package, UserCheck, Clock, AlertCircle, CheckCircle2, DollarSign, BarChart3, Bell } from 'lucide-react';
import { TimelineFeed } from '@/components/timeline/TimelineFeed';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Order { id: string; amount: number; status: string; created_at: string }
interface ServiceStat { id: string; name: string; category: string; paid_count: number; revenue: number }
interface HiringStat { total_applicants: number; open_positions: number; pending_reviews: number }
interface ProjectStat { active: number; completed: number; overdue: number }

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [topServices, setTopServices] = useState<ServiceStat[]>([]);
  const [hiringStats, setHiringStats] = useState<HiringStat | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectStat | null>(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, topRes, hiringRes, projectsRes] = await Promise.all([
          supabase.from('orders').select('id, amount, status, created_at').order('created_at', { ascending: false }).limit(500),
          supabase.from('admin_top_services').select('*').limit(10),
          supabase.rpc('admin_hiring_stats'),
          supabase.rpc('admin_project_stats'),
        ]);
        setOrders((ordersRes?.data ?? []) as Order[]);
        setTopServices((topRes?.data ?? []) as ServiceStat[]);
        setHiringStats(hiringRes?.data || null);
        setProjectStats(projectsRes?.data || null);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = useMemo(() => {
    const paid = orders.filter((o) => o.status === 'paid');
    const recentPaid = paid.filter(o => {
      const daysAgo = (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });
    
    return {
      total: orders.length,
      paid: paid.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      revenue: paid.reduce((s, o) => s + (o.amount ?? 0), 0),
      weeklyRevenue: recentPaid.reduce((s, o) => s + o.amount, 0),
      aov: paid.length > 0 ? paid.reduce((s, o) => s + o.amount, 0) / paid.length : 0,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <Skeleton variant="text" className="w-1/3 h-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-28" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton variant="card" className="h-96 lg:col-span-2" />
          <Skeleton variant="card" className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold cyber-text">Admin Command Center</h1>
          <p className="text-white/60 text-sm mt-1">Real-time platform analytics & operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Bell className="w-4 h-4" />} label="Notifications" />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<DollarSign className="w-5 h-5 text-cyan-400" />}
          title="Total Revenue"
          value={`₹${kpis.revenue.toLocaleString('en-IN')}`}
          subtitle={`₹${kpis.weeklyRevenue.toLocaleString('en-IN')} this week`}
          accent="cyan"
        />
        <KpiCard
          icon={<ShoppingBag className="w-5 h-5 text-green-400" />}
          title="Paid Orders"
          value={kpis.paid}
          subtitle={`${kpis.pending} pending`}
          accent="green"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
          title="Avg Order Value"
          value={`₹${Math.round(kpis.aov).toLocaleString('en-IN')}`}
          subtitle="Per transaction"
          accent="purple"
        />
        <KpiCard
          icon={<Users className="w-5 h-5 text-yellow-400" />}
          title="Total Orders"
          value={kpis.total}
          subtitle="All time"
          accent="yellow"
        />
      </div>

      {/* Operational Stats */}
      {(hiringStats || projectStats) && (
        <div className="grid md:grid-cols-2 gap-4">
          {hiringStats && (
            <div className="glass rounded-xl p-6 border border-cyan-500/10">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Hiring Pipeline</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-white/40 text-xs font-mono">Open Positions</p>
                  <p className="text-2xl font-bold text-cyan-400 font-mono">{hiringStats.open_positions}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs font-mono">Total Applicants</p>
                  <p className="text-2xl font-bold text-purple-400 font-mono">{hiringStats.total_applicants}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs font-mono">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-400 font-mono">{hiringStats.pending_reviews}</p>
                </div>
              </div>
              <Link href="/admin/hiring" className="mt-4 block">
                <Button variant="outline" size="sm" label="Manage Hiring" className="w-full" />
              </Link>
            </div>
          )}
          
          {projectStats && (
            <div className="glass rounded-xl p-6 border border-purple-500/10">
              <div className="flex items-center gap-2 mb-4">
                <FolderKanban className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Project Overview</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-white/40 text-xs font-mono">Active</p>
                  <p className="text-2xl font-bold text-cyan-400 font-mono">{projectStats.active}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs font-mono">Completed</p>
                  <p className="text-2xl font-bold text-green-400 font-mono">{projectStats.completed}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs font-mono">Overdue</p>
                  <p className="text-2xl font-bold text-red-400 font-mono">{projectStats.overdue}</p>
                </div>
              </div>
              <Link href="/admin/projects" className="mt-4 block">
                <Button variant="outline" size="sm" label="View Projects" className="w-full" />
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Services */}
        <section className="lg:col-span-2 glass rounded-xl p-6 border border-cyan-500/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Top Performing Services</h2>
            </div>
            <Link href="/admin/services">
              <Button variant="ghost" size="sm" label="View All" />
            </Link>
          </div>
          
          {topServices.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-cyan-400/40 mx-auto mb-3" />
              <p className="text-white/40 text-sm font-mono">No paid orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topServices.map((s, index) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-white/20 font-mono text-sm w-6">#{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{s.name}</p>
                      <p className="text-white/40 text-xs">{s.category}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-cyan-400 font-mono font-bold">₹{s.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-white/30 text-xs">{s.paid_count} sales</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="glass rounded-xl p-6 border border-purple-500/10">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Live Activity</h2>
          </div>
          <TimelineFeed visibility="client" emptyMessage="No activity yet" />
        </section>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction href="/admin/services" label="Services" icon={Package} color="cyan" />
          <QuickAction href="/admin/orders" label="Orders" icon={ShoppingBag} color="green" />
          <QuickAction href="/admin/codes" label="Promo Codes" icon={Tag} color="purple" />
          <QuickAction href="/admin/referrals" label="Referrals" icon={Gift} color="yellow" />
          <QuickAction href="/admin/hiring" label="Hiring" icon={UserCheck} color="cyan" />
          <QuickAction href="/admin/projects" label="Projects" icon={FolderKanban} color="purple" />
          <QuickAction href="/admin/users" label="Users" icon={Users} color="green" />
          <QuickAction href="/admin/reports" label="Reports" icon={BarChart3} color="yellow" />
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  title,
  value,
  subtitle,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  accent: 'cyan' | 'green' | 'purple' | 'yellow';
}) {
  const accentColors = {
    cyan: 'hover:border-cyan-500/30',
    green: 'hover:border-green-500/30',
    purple: 'hover:border-purple-500/30',
    yellow: 'hover:border-yellow-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass rounded-xl p-5 transition', accentColors[accent])}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/60 text-sm">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-white font-mono">{value}</div>
      {subtitle && <p className="text-white/40 text-xs mt-1">{subtitle}</p>}
    </motion.div>
  );
}

function QuickAction({ 
  href, 
  label, 
  icon: Icon, 
  color 
}: { 
  href: string; 
  label: string; 
  icon: typeof Package;
  color: 'cyan' | 'green' | 'purple' | 'yellow';
}) {
  const colors = {
    cyan: 'hover:border-cyan-500/30 group-hover:text-cyan-400',
    green: 'hover:border-green-500/30 group-hover:text-green-400',
    purple: 'hover:border-purple-500/30 group-hover:text-purple-400',
    yellow: 'hover:border-yellow-500/30 group-hover:text-yellow-400',
  };

  return (
    <Link 
      href={href} 
      className={cn('glass rounded-xl p-5 text-center transition group', colors[color])}
    >
      <Icon className="w-8 h-8 text-white/40 mx-auto mb-2 group-hover:scale-110 transition" />
      <span className="text-white/80 text-sm font-medium">{label}</span>
    </Link>
  );
}
