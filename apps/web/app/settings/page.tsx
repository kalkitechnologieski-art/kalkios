'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Shield, CreditCard, Bell, Palette, Sparkles,
  Save, RefreshCw, LogOut, ChevronRight,
  Database, Globe, Share2, Smartphone, Monitor, Zap, HardDrive,
  AlertCircle, Eye, Fingerprint, Key,
  CheckCircle, Loader2
} from 'lucide-react'

type SettingsTab = 'profile' | 'security' | 'billing' | 'notifications' | 'preferences' | 'data'

// Toast notification component (inline)
function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void }) {
  const colors = {
    success: 'bg-green-500/20 border-green-500/30 text-green-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  }
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl border backdrop-blur-lg flex items-center gap-3 ${colors[type]}`}>
      {type === 'success' && <CheckCircle className="w-5 h-5" />}
      {type === 'error' && <AlertCircle className="w-5 h-5" />}
      <span className="text-sm font-mono">{message}</span>
      <button onClick={onClose} className="text-white/40 hover:text-white transition">✕</button>
    </div>
  )
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
  })
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    push_enabled: true,
    in_app_enabled: true,
    chat_notifications: true,
    token_milestones: true,
    project_updates: true,
    system_notifications: true,
  })
  const supabase = createClient()
  const router = useRouter()

  // Fetch profile and preferences
  useEffect(() => {
    if (!user) { setLoading(false); return }
    const fetchData = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)
        setFormData({
          fullName: profileData?.full_name || '',
          email: user.email || '',
          phone: profileData?.phone || '',
          company: profileData?.company || '',
        })

        // Fetch preferences
        const { data: prefData } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()
        if (prefData) {
          setPreferences({
            email_enabled: prefData.email_enabled ?? true,
            push_enabled: prefData.push_enabled ?? true,
            in_app_enabled: prefData.in_app_enabled ?? true,
            chat_notifications: prefData.chat_notifications ?? true,
            token_milestones: prefData.token_milestones ?? true,
            project_updates: prefData.project_updates ?? true,
            system_notifications: prefData.system_notifications ?? true,
          })
        }
      } catch (e) {
        console.warn('Could not fetch data:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, supabase])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Save Profile ──
  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          company: formData.company,
        })
        .eq('id', user.id)
      if (error) throw error
      showToast('Profile updated successfully!', 'success')
    } catch (err) {
      showToast('Failed to update profile.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Reset Form ──
  const handleReset = () => {
    if (!profile) return
    setFormData({
      fullName: profile.full_name || '',
      email: user?.email || '',
      phone: profile.phone || '',
      company: profile.company || '',
    })
    showToast('Form reset to current values.', 'info')
  }

  // ── Change Password ──
  const handleChangePassword = async () => {
    if (!user) return
    const newPassword = prompt('Enter your new password:')
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error')
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      showToast('Password updated successfully!', 'success')
    } catch (err) {
      showToast('Failed to update password.', 'error')
    }
  }

  // ── Delete Account ──
  const handleDeleteAccount = async () => {
    if (!user) return
    const confirm = window.confirm(
      '⚠️ Are you sure you want to delete your account? This action is irreversible.'
    )
    if (!confirm) return

    // Call API route to delete account (admin or auth admin needed)
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }
      // Sign out and redirect
      await supabase.auth.signOut()
      router.push('/login')
      showToast('Account deleted successfully.', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to delete account.', 'error')
    }
  }

  // ── Toggle Preference ──
  const togglePreference = async (key: keyof typeof preferences) => {
    if (!user) return
    const newValue = !preferences[key]
    // Optimistic update
    setPreferences(prev => ({ ...prev, [key]: newValue }))
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: newValue })
        .eq('user_id', user.id)
      if (error) throw error
      showToast(`${key.replace('_', ' ')} updated.`, 'success')
    } catch (err) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !newValue }))
      showToast('Failed to update preference.', 'error')
    }
  }

  // ── Logout ──
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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

  // ── Tab definitions ──
  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'data', label: 'Data Control', icon: Database },
  ]

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="w-6 h-6 text-cyan-400" />
        <h1 className="text-3xl font-bold text-white font-mono">Settings</h1>
        <span className="text-xs text-cyan-400/30 font-mono ml-auto border border-cyan-500/10 px-3 py-1 rounded-full">
          {profile?.role?.toUpperCase() || 'USER'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="md:col-span-1 bg-white/5 border border-cyan-500/10 rounded-xl p-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  isActive
                    ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/20'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-mono">{tab.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            )
          })}
          <div className="h-px bg-white/5 my-2" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-mono">Logout</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-white/5 border border-cyan-500/10 rounded-xl p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-mono">Profile Settings</h2>
                <p className="text-cyan-400/40 text-sm font-mono">Manage your personal information</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-cyan-400/60 text-xs font-mono block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-cyan-400/60 text-xs font-mono block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-black/20 border border-cyan-500/10 rounded-lg px-4 py-2.5 text-white/40 outline-none font-mono text-sm cursor-not-allowed"
                  />
                  <p className="text-cyan-400/20 text-xs font-mono mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-cyan-400/60 text-xs font-mono block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-cyan-400/60 text-xs font-mono block mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition font-mono text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <LuxuryButton
                    variant="primary"
                    size="md"
                    label={saving ? 'Saving...' : 'Save Changes'}
                    icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    iconPosition="left"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  />
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 text-sm font-mono transition flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-mono">Security</h2>
                <p className="text-cyan-400/40 text-sm font-mono">Manage your account security</p>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 border border-cyan-500/10 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-mono text-sm flex items-center gap-2">
                      <Key className="w-4 h-4 text-cyan-400" />
                      Password
                    </p>
                    <p className="text-cyan-400/30 text-xs font-mono">Change your password</p>
                  </div>
                  <LuxuryButton variant="secondary" size="sm" label="Change" onClick={handleChangePassword} />
                </div>
                <div className="bg-white/5 border border-cyan-500/10 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-mono text-sm flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-cyan-400" />
                      Two-Factor Authentication
                    </p>
                    <p className="text-cyan-400/30 text-xs font-mono">Add an extra layer of security</p>
                  </div>
                  <button
                    onClick={() => togglePreference('email_enabled')}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                      preferences.email_enabled ? 'bg-cyan-600' : 'bg-white/20'
                    }`}
                  >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                      preferences.email_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                <div className="bg-white/5 border border-red-500/10 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-red-400 font-mono text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      Delete Account
                    </p>
                    <p className="text-cyan-400/30 text-xs font-mono">Permanently delete your account</p>
                  </div>
                  <LuxuryButton variant="destructive" size="sm" label="Delete" onClick={handleDeleteAccount} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-mono">Billing & Usage</h2>
                <p className="text-cyan-400/40 text-sm font-mono">Manage your subscription and payments</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-cyan-500/10 rounded-lg p-4">
                  <p className="text-cyan-400/40 text-xs font-mono">Current Plan</p>
                  <p className="text-white font-bold text-lg font-mono">Enterprise</p>
                  <p className="text-cyan-400/30 text-xs font-mono">Unlimited tokens • Priority support</p>
                </div>
                <div className="bg-white/5 border border-cyan-500/10 rounded-lg p-4">
                  <p className="text-cyan-400/40 text-xs font-mono">Tokens Used</p>
                  <p className="text-white font-bold text-lg font-mono">0 / ∞</p>
                  <p className="text-cyan-400/30 text-xs font-mono">Unlimited usage</p>
                </div>
              </div>
              <div className="bg-white/5 border border-cyan-500/10 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-mono text-sm flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    Invoices
                  </p>
                  <p className="text-cyan-400/30 text-xs font-mono">View your billing history</p>
                </div>
                <LuxuryButton variant="secondary" size="sm" label="View All" />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-mono">Notifications</h2>
                <p className="text-cyan-400/40 text-sm font-mono">Manage your notification preferences</p>
              </div>
              <div className="space-y-3">
                {Object.entries(preferences).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
                    <div>
                      <p className="text-white/80 text-sm font-mono capitalize">{key.replace('_', ' ')}</p>
                      <p className="text-cyan-400/30 text-xs font-mono">Toggle {key.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={() => togglePreference(key as keyof typeof preferences)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                        value ? 'bg-cyan-600' : 'bg-white/20'
                      }`}
                    >
                      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-mono">Preferences</h2>
                <p className="text-cyan-400/40 text-sm font-mono">Customize your experience</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
                  <div><p className="text-white/80 text-sm font-mono flex items-center gap-2"><Monitor className="w-4 h-4 text-cyan-400" /> Dark Mode</p><p className="text-cyan-400/30 text-xs font-mono">Always enabled</p></div>
                  <div className="text-cyan-400">On</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
                  <div><p className="text-white/80 text-sm font-mono flex items-center gap-2"><Smartphone className="w-4 h-4 text-cyan-400" /> AI Voice Input</p><p className="text-cyan-400/30 text-xs font-mono">Enable voice commands</p></div>
                  <button
                    onClick={() => togglePreference('push_enabled')}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                      preferences.push_enabled ? 'bg-cyan-600' : 'bg-white/20'
                    }`}
                  >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                      preferences.push_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  Data Control
                </h2>
                <p className="text-cyan-400/40 text-sm font-mono">Manage your data privacy and consent</p>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'email_enabled', label: 'Email Communications', desc: 'Receive promotional emails' },
                  { key: 'system_notifications', label: 'System Notifications', desc: 'Important platform updates' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
                    <div>
                      <p className="text-white/80 text-sm font-mono">{label}</p>
                      <p className="text-cyan-400/30 text-xs font-mono">{desc}</p>
                    </div>
                    <button
                      onClick={() => togglePreference(key as keyof typeof preferences)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                        preferences[key as keyof typeof preferences] ? 'bg-cyan-600' : 'bg-white/20'
                      }`}
                    >
                      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                        preferences[key as keyof typeof preferences] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
