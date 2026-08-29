'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/badge'
import { sendBulkNotifications, notifyAdmins, notifyEmployees } from '@/lib/notifications'
import { toast } from 'sonner'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Users, Send } from 'lucide-react'

export default function AdminNotificationsPage() {
  const { user } = useUser()
  const [allNotifications, setAllNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('system')
  const [priority, setPriority] = useState('normal')
  const [target, setTarget] = useState('all') // 'all', 'admins', 'employees', 'specific'
  const [targetUsers, setTargetUsers] = useState<string[]>([])
  const supabase = createClient()

  const fetchAllNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(100)
    setAllNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return
    fetchAllNotifications()
  }, [user])

  const handleSendNotification = async () => {
    if (!title || !message) {
      toast.error('Title and message are required')
      return
    }
    try {
      let userIds: string[] = []
      if (target === 'admins') {
        const { data } = await supabase.from('profiles').select('id').in('role', ['ceo', 'admin', 'manager'])
        userIds = data?.map((p: any) => p.id) || []
      } else if (target === 'employees') {
        const { data } = await supabase.from('profiles').select('id').in('role', ['employee', 'developer', 'support', 'hr'])
        userIds = data?.map((p: any) => p.id) || []
      } else if (target === 'specific' && targetUsers.length > 0) {
        userIds = targetUsers
      } else {
        // all users
        const { data } = await supabase.from('profiles').select('id')
        userIds = data?.map((p: any) => p.id) || []
      }
      if (userIds.length === 0) {
        toast.error('No users to notify')
        return
      }
      await sendBulkNotifications(
        userIds,
        title,
        message,
        type as any,
        priority as any,
        '/',
        { from_admin: true, admin_name: user?.user_metadata?.full_name || 'Admin' }
      )
      toast.success(`Notification sent to ${userIds.length} users`)
      setTitle('')
      setMessage('')
      fetchAllNotifications()
    } catch (error) {
      toast.error('Failed to send notification')
      console.error(error)
    }
  }

  const columns = [
    { key: 'title', header: 'Title', searchable: true },
    { key: 'message', header: 'Message', searchable: true },
    { key: 'type', header: 'Type', render: (val: string) => <Badge variant="secondary">{val}</Badge> },
    { key: 'priority', header: 'Priority', render: (val: string) => <Badge variant={val === 'critical' ? 'destructive' : val === 'high' ? 'default' : 'secondary'}>{val}</Badge> },
    { key: 'created_at', header: 'Sent', render: (val: string) => new Date(val).toLocaleString() },
  ]

  if (!user) return <div className="text-center py-20"><a href="/login" className="text-cyan-400">Sign in</a></div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">Admin – Notifications</h1>

      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-bold text-lg">Send Push Notification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Notification Title"
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500/50"
          />
          <select
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
          >
            <option value="all">All Users</option>
            <option value="admins">Admins only</option>
            <option value="employees">Employees only</option>
            <option value="specific">Specific Users (coming soon)</option>
          </select>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
          >
            <option value="system">System</option>
            <option value="task">Task</option>
            <option value="project">Project</option>
            <option value="meeting">Meeting</option>
            <option value="bug">Bug</option>
          </select>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Notification Message"
          rows={3}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500/50 resize-none"
        />
        <LuxuryButton
          variant="primary"
          size="md"
          label="Send Notification"
          icon={<Send className="w-4 h-4" />}
          onClick={handleSendNotification}
        />
      </div>

      <div className="mt-6">
        <h2 className="text-white font-bold text-lg mb-4">Recent Notifications</h2>
        <DataTable
          data={allNotifications}
          columns={columns}
          keyExtractor={row => row.id}
          loading={loading}
          searchPlaceholder="Search notifications..."
        />
      </div>
    </div>
  )
}
