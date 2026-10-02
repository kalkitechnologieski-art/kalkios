'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useAuth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, FolderKanban, User, MessageSquare, Calendar, TrendingUp, Bell, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface TimesheetEntry {
  total_hours: number;
}

export default function EmployeeDashboard() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timesheetHours, setTimesheetHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const load = async () => {
      try {
        const [{ data: tasksData }, { data: projectsData }, { data: timesheetData }] = await Promise.all([
          supabase
            .from('tasks')
            .select('id, title, status, priority, due_date, project_id')
            .eq('assigned_to', user.id)
            .order('due_date', { ascending: true })
            .limit(20),
          supabase
            .from('projects')
            .select('id, name, status')
            .eq('lead_employee_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .rpc('employee_total_hours', { employee_id: user.id }),
        ]);

        setTasks((tasksData ?? []) as Task[]);
        setProjects((projectsData ?? []) as Project[]);
        setTimesheetHours(timesheetData?.total_hours || 0);
      } catch (err) {
        console.error('Employee dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <Skeleton variant="text" className="w-1/3 h-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-28" />
          ))}
        </div>
        <Skeleton variant="card" className="h-96" />
      </div>
    );
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < new Date();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold cyber-text">Employee Workspace</h1>
          <p className="text-white/60 text-sm mt-1">
            Welcome back, <span className="text-white font-medium">{user.email?.split('@')[0] ?? 'there'}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<Bell className="w-4 h-4" />} label="Notifications" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckSquare className="w-5 h-5 text-cyan-400" />}
          title="Active Tasks"
          value={activeTasks.length}
          subtitle={`${completedTasks.length} completed`}
          accent="cyan"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-green-400" />}
          title="Hours Logged"
          value={timesheetHours.toFixed(1)}
          subtitle="This month"
          accent="green"
        />
        <StatCard
          icon={<FolderKanban className="w-5 h-5 text-purple-400" />}
          title="My Projects"
          value={projects.length}
          subtitle="Assigned to you"
          accent="purple"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-yellow-400" />}
          title="Overdue"
          value={overdueTasks.length}
          subtitle="Needs attention"
          accent="yellow"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Recent Tasks</h2>
            <Link href="/employee/tasks">
              <Button variant="ghost" size="sm" label="View All" />
            </Link>
          </div>

          {activeTasks.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center border border-cyan-500/10">
              <CheckSquare className="w-12 h-12 text-cyan-400/40 mx-auto mb-4" />
              <p className="text-white/60 text-sm mb-4">No active tasks assigned</p>
              <Link href="/employee/projects">
                <Button variant="outline" size="sm" label="Browse Projects" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.slice(0, 8).map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass rounded-xl p-4 hover:border-cyan-500/30 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TaskPriorityBadge priority={task.priority} />
                        <p className="text-white font-medium truncate">{task.title}</p>
                      </div>
                      <p className="text-white/40 text-xs">
                        {task.due_date && `Due ${new Date(task.due_date).toLocaleDateString()} · `}
                        {task.project_id ? 'Project task' : 'General task'}
                      </p>
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          {/* Overdue Alert */}
          {overdueTasks.length > 0 && (
            <div className="glass rounded-xl p-4 border border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-white">Overdue Tasks</h3>
              </div>
              <p className="text-white/60 text-xs mb-3">{overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} past deadline</p>
              <Link href="/employee/tasks?filter=overdue">
                <Button variant="destructive" size="sm" label="Review Now" className="w-full" />
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="glass rounded-xl p-4 border border-cyan-500/10">
            <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/employee/tasks" className="block">
                <Button variant="outline" size="sm" label="My Tasks" icon={<CheckSquare className="w-4 h-4" />} className="w-full justify-start" />
              </Link>
              <Link href="/employee/timesheet" className="block">
                <Button variant="outline" size="sm" label="Log Hours" icon={<Clock className="w-4 h-4" />} className="w-full justify-start" />
              </Link>
              <Link href="/employee/chat" className="block">
                <Button variant="outline" size="sm" label="Team Chat" icon={<MessageSquare className="w-4 h-4" />} className="w-full justify-start" />
              </Link>
              <Link href="/employee/profile" className="block">
                <Button variant="outline" size="sm" label="My Profile" icon={<User className="w-4 h-4" />} className="w-full justify-start" />
              </Link>
            </div>
          </div>

          {/* Projects Summary */}
          {projects.length > 0 && (
            <div className="glass rounded-xl p-4 border border-purple-500/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">My Projects</h3>
                <Link href="/employee/projects" className="text-cyan-400 text-xs">View all →</Link>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {projects.slice(0, 5).map(p => (
                  <Link key={p.id} href={`/employee/project/${p.id}`} className="block">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
                      <p className="text-white/80 text-sm truncate flex-1">{p.name}</p>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
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

function TaskPriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: 'bg-blue-500/20 text-blue-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium uppercase', colors[priority] || 'bg-white/10 text-white/60')}>
      {priority}
    </span>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    in_progress: 'bg-cyan-500/20 text-cyan-400',
    review: 'bg-purple-500/20 text-purple-400',
    completed: 'bg-green-500/20 text-green-400',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[status] || 'bg-white/10 text-white/60')}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ProjectStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    planning: 'bg-blue-500/20 text-blue-400',
    active: 'bg-cyan-500/20 text-cyan-400',
    review: 'bg-purple-500/20 text-purple-400',
    completed: 'bg-green-500/20 text-green-400',
    on_hold: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', colors[status] || 'bg-white/10 text-white/60')}>
      {status.replace('_', ' ')}
    </span>
  );
}
