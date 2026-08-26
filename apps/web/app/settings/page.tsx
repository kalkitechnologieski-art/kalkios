'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { SideMenu } from '@/components/layout/SideMenu'
import {
  User, Shield, CreditCard, Bell, Palette, Sparkles,
  Save, RefreshCw, LogOut, ChevronRight,
  Database, Globe, Share2,
  Download, Upload, Key, Fingerprint, Eye,
  Smartphone, Monitor, Zap, HardDrive,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type SettingsTab = 'profile' | 'security' | 'billing' | 'notifications' | 'preferences' | 'data'

export default function SettingsPage() {
  const { user, loading: authLoading } = useUser()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
  })
  const supabase = createClient()
  const router = useRouter()

  // Toggle states for data control
  const [toggles, setToggles] = useState({
    dataProcessing: true,
    marketingComms: false,
    thirdPartySharing: false,
    researchParticipation: true,
    darkMode: true,
    aiVoice: true,
    notifications: true,
    twoFactor: false,
    sessionTracking: true,
    analytics: true,
    autoSave: true,
    compressUploads: false,
  })

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setFormData({
        fullName: data?.full_name || '',
        email: user.email || '',
        phone: data?.phone || '',
        company: data?.company || '',
      })
      setLoading(false)
    }
    fetchProfile()
  }, [user, supabase])

  const handleSave = async () => {
    if (!user) return
    await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName,
        phone: formData.phone,
        company: formData.company,
      })
      .eq('id', user.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const toggleSwitch = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
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

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'data', label: 'Data Control', icon: Database },
  ]

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#0A0A0F]">
      <SideMenu />
      <div className="flex-1 ml-16 md:ml-64 p-6 md:p-8 overflow-y-auto scrollbar-hide">
        <div className="max-w-4xl mx-auto">
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

            {/* Content */}
            <div className="md:col-span-3 bg-white/5 border border-cyan-500/10 rounded-xl p-6">
              {/* PROFILE TAB */}
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
                        label={saved ? '✓ Saved!' : 'Save Changes'}
                        icon={saved ? undefined : <Save className="w-4 h-4" />}
                        iconPosition="left"
                        onClick={handleSave}
                      />
                      <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 text-sm font-mono transition flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
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
                        <p className="text-cyan-400/30 text-xs font-mono">Last changed: Never</p>
                      </div>
                      <LuxuryButton variant="secondary" size="sm" label="Change" />
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
                        onClick={() => toggleSwitch('twoFactor')}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          toggles.twoFactor ? 'bg-cyan-600' : 'bg-white/20'
                        }`}
                      >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                          toggles.twoFactor ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="bg-white/5 border border-cyan-500/10 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-mono text-sm flex items-center gap-2">
                          <Eye className="w-4 h-4 text-cyan-400" />
                          Session Tracking
                        </p>
                        <p className="text-cyan-400/30 text-xs font-mono">Monitor active sessions</p>
                      </div>
                      <button
                        onClick={() => toggleSwitch('sessionTracking')}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          toggles.sessionTracking ? 'bg-cyan-600' : 'bg-white/20'
                        }`}
                      >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                          toggles.sessionTracking ? 'translate-x-6' : 'translate-x-1'
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
                      <LuxuryButton variant="danger" size="sm" label="Delete" />
                    </div>
                  </div>
                </div>
              )}

              {/* BILLING TAB */}
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

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white font-mono">Notifications</h2>
                    <p className="text-cyan-400/40 text-sm font-mono">Manage your notification preferences</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'notifications', label: 'Email Updates', desc: 'Receive product updates and news' },
                      { key: 'notifications', label: 'Project Updates', desc: 'Get notified about project changes' },
                      { key: 'notifications', label: 'Billing Alerts', desc: 'Payment and invoice reminders' },
                      { key: 'notifications', label: 'System Announcements', desc: 'Important platform updates' },
                      { key: 'notifications', label: 'AI Insights', desc: 'Weekly AI-powered recommendations' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
                        <div>
                          <p className="text-white/80 text-sm font-mono">{item.label}</p>
                          <p className="text-cyan-400/30 text-xs font-mono">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => toggleSwitch('notifications')}
                          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                            toggles.notifications ? 'bg-cyan-600' : 'bg-white/20'
                          }`}
                        >
                          <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                            toggles.notifications ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PREFERENCES TAB */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white font-mono">Preferences</h2>
                    <p className="text-cyan-400/40 text-sm font-mono">Customize your experience</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
                      <div>
                        <p className="text-white/80 text-sm font-mono flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-cyan-400" />
                          Dark Mode
                        </p>
                        <p className="text-cyan-400/30 text-xs font-mono">Always enabled for cyberpunk experience</p>
                      </div>
                      <button
                        onClick={() => toggleSwitch('darkMode')}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          toggles.darkMode ? 'bg-cyan-600' : 'bg-white/20'
                        }`}
                      >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                          toggles.darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
                      <div>
                        <p className="text-white/80 text-sm font-mono flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-cyan-400" />
                          AI Voice Input
                        </p>
                        <p className="text-cyan-400/30 text-xs font-mono">Enable voice commands</p>
                      </div>
                      <button
                        onClick={() => toggleSwitch('aiVoice')}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          toggles.aiVoice ? 'bg-cyan-600' : 'bg-white/20'
                        }`}
                      >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                          toggles.aiVoice ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
                      <div>
                        <p className="text-white/80 text-sm font-mono flex items-center gap-2">
                          <Globe className="w-4 h-4 text-cyan-400" />
                          Language
                        </p>
                        <p className="text-cyan-400/30 text-xs font-mono">English (US)</p>
                      </div>
                      <LuxuryButton variant="secondary" size="sm" label="Change" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
                      <div>
                        <p className="text-white/80 text-sm font-mono flex items-center gap-2">
                          <Zap className="w-4 h-4 text-cyan-400" />
                          Auto‑Save
                        </p>
                        <p className="text-cyan-400/30 text-xs font-mono">Automatically save changes</p>
                      </div>
                      <button
                        onClick={() => toggleSwitch('autoSave')}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                          toggles.autoSave ? 'bg-cyan-600' : 'bg-white/20'
                        }`}
                      >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                          toggles.autoSave ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DATA CONTROL TAB */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
                      <Database className="w-5 h-5 text-cyan-400" />
                      Data Control
                    </h2>
                    <p className="text-cyan-400/40 text-sm font-mono">Manage your data privacy and consent</p>
                  </div>

                  {/* Master Enable Toggle */}
                  <div className="bg-gradient-to-r from-cyan-600/10 to-purple-600/10 border border-cyan-500/20 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-mono text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        Data Processing Master Control
                      </p>
                      <p className="text-cyan-400/30 text-xs font-mono">Enable or disable all data processing</p>
                    </div>
                    <button
                      onClick={() => toggleSwitch('dataProcessing')}
                      className={`relative inline-flex items-center h-7 rounded-full w-12 transition-colors focus:outline-none ${
                        toggles.dataProcessing ? 'bg-cyan-600' : 'bg-white/20'
                      }`}
                    >
                      <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition ${
                        toggles.dataProcessing ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Consent Toggles */}
                  <div className="space-y-3">
                    {[
                      { key: 'dataProcessing', label: 'Data Processing Consent', desc: 'Allow processing of your data for core functionality', icon: Database },
                      { key: 'marketingComms', label: 'Marketing Communications', desc: 'Receive promotional emails and offers', icon: Share2 },
                      { key: 'thirdPartySharing', label: 'Third‑Party Data Sharing', desc: 'Share anonymized data with trusted partners', icon: Globe },
                      { key: 'researchParticipation', label: 'Research Participation', desc: 'Contribute to AI research and improvement', icon: Zap },
                      { key: 'analytics', label: 'Analytics & Performance', desc: 'Help us improve the platform with usage data', icon: Monitor },
                      { key: 'compressUploads', label: 'Compress Uploads', desc: 'Automatically optimize images and files', icon: HardDrive },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg hover:border-cyan-500/20 transition">
                        <div>
                          <p className="text-white/80 text-sm font-mono flex items-center gap-2">
                            <item.icon className="w-4 h-4 text-cyan-400" />
                            {item.label}
                          </p>
                          <p className="text-cyan-400/30 text-xs font-mono">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => toggleSwitch(item.key as keyof typeof toggles)}
                          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                            toggles[item.key as keyof typeof toggles] ? 'bg-cyan-600' : 'bg-white/20'
                          }`}
                        >
                          <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
                            toggles[item.key as keyof typeof toggles] ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Data Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-cyan-500/10">
                    <button className="flex items-center gap-3 p-3 bg-white/5 border border-cyan-500/10 rounded-lg hover:border-cyan-500/30 transition text-white/80 hover:text-white">
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-mono">Export My Data</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 bg-white/5 border border-red-500/10 rounded-lg hover:border-red-500/30 transition text-red-400/80 hover:text-red-400">
                      <Upload className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-mono">Request Data Deletion</span>
                    </button>
                  </div>

                  <div className="text-cyan-400/20 text-[10px] font-mono text-center pt-2 border-t border-cyan-500/5">
                    🔹 Your data is encrypted and stored securely. You have full control.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
