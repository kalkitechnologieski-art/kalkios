'use client'

import { useUser } from '@/hooks/useAuth'
import { useNotificationPreferences } from '@/lib/hooks/useNotifications'
import Link from 'next/link'
import { ChevronLeft, Bell, BellOff, Mail, MessageSquare, TrendingUp, FolderKanban, Settings as SettingsIcon } from 'lucide-react'

export default function NotificationSettingsPage() {
  const { user, loading: authLoading } = useUser()
  const { preferences, loading, updatePreference } = useNotificationPreferences()

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-xl font-bold text-white">Please Sign In</h2>
        <Link href="/login" className="mt-4 text-cyan-400 hover:text-cyan-300">Go to Login →</Link>
      </div>
    )
  }

  const settings = [
    { key: 'email_enabled', label: 'Email Notifications', desc: 'Receive notifications via email', icon: Mail },
    { key: 'push_enabled', label: 'Push Notifications', desc: 'Get push notifications in browser', icon: Bell },
    { key: 'in_app_enabled', label: 'In-App Notifications', desc: 'Show notifications inside the app', icon: SettingsIcon },
    { key: 'chat_notifications', label: 'Chat Messages', desc: 'Notify when you receive chat messages', icon: MessageSquare },
    { key: 'token_milestones', label: 'Token Milestones', desc: 'Get notified when you reach token milestones', icon: TrendingUp },
    { key: 'project_updates', label: 'Project Updates', desc: 'Stay updated on project progress', icon: FolderKanban },
    { key: 'system_notifications', label: 'System Announcements', desc: 'Important system updates', icon: BellOff },
  ]

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/settings" className="text-cyan-400/60 hover:text-cyan-400 transition">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <Bell className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl font-bold text-white font-mono">Notification Settings</h1>
      </div>

      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 space-y-4">
        <p className="text-cyan-400/40 text-sm font-mono">
          Manage how and when you receive notifications.
        </p>

        {settings.map((setting) => {
          const Icon = setting.icon
          const value = preferences?.[setting.key as keyof typeof preferences] ?? true
          return (
            <div
              key={setting.key}
              className="flex items-center justify-between p-4 bg-white/5 border border-cyan-500/10 rounded-lg hover:border-cyan-500/30 transition"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-600/10 rounded-lg">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-mono">{setting.label}</p>
                  <p className="text-cyan-400/30 text-xs font-mono">{setting.desc}</p>
                </div>
              </div>
              <button
                onClick={() => updatePreference(setting.key as any, !value)}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                  value ? 'bg-cyan-600' : 'bg-white/20'
                }`}
              >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-6 text-center text-cyan-400/20 text-[10px] font-mono">
        🔹 Changes are saved automatically
      </div>
    </div>
  )
}
