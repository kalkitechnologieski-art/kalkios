'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Shield, Trash2, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DistributedComputeConsent } from '@/components/siddhi/DistributedComputeConsent';
import { getDeviceState, unloadDeviceEngine } from '@/lib/ai';
import { cn } from '@/lib/utils';

interface Preferences {
  consentGranted: boolean;
  preferredTier: string | null;
  lastActive: string | null;
}

export default function DistributedComputeSettings() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState(getDeviceState());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPreferences();
    
    // Poll device status every 2 seconds
    const interval = setInterval(() => {
      setDeviceStatus(getDeviceState());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch('/api/ai/distributed');
      if (!res.ok) throw new Error('Failed to fetch preferences');
      const data = await res.json();
      setPreferences(data);
      
      // Show consent dialog if user hasn't decided yet
      if (data.consentGranted === false && !data.preferredTier) {
        setShowConsentDialog(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }

  async function handleConsent(granted: boolean) {
    try {
      const res = await fetch('/api/ai/distributed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          consent: granted,
          tier: granted ? 'fast' : null,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to update preferences');
      
      await fetchPreferences();
      setShowConsentDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    }
  }

  async function handleDisable() {
    if (!confirm('This will unload the local AI model. Siddhi will use cloud inference instead.')) {
      return;
    }

    try {
      unloadDeviceEngine();
      
      const res = await fetch('/api/ai/distributed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: false, tier: null }),
      });
      
      if (!res.ok) throw new Error('Failed to disable');
      
      await fetchPreferences();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable');
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <Skeleton variant="text" className="w-1/2 h-8" />
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold cyber-text">Distributed Compute</h1>
        <p className="text-white/60 text-sm mt-1">
          Run AI models on your device for faster, private responses
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setError(null)} icon={<X className="w-4 h-4" />} />
        </div>
      )}

      {/* Consent Status */}
      <div className="glass rounded-xl p-6 border border-cyan-500/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Cpu className={cn('w-8 h-8', preferences?.consentGranted ? 'text-green-400' : 'text-white/40')} />
            <div>
              <h2 className="text-lg font-bold text-white">Local AI Inference</h2>
              <p className="text-white/60 text-sm">
                {preferences?.consentGranted ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          
          {preferences?.consentGranted ? (
            <Button variant="destructive" size="sm" label="Disable" icon={<Trash2 className="w-4 h-4" />} onClick={handleDisable} />
          ) : (
            <Button variant="cyber" size="sm" label="Enable" onClick={() => setShowConsentDialog(true)} />
          )}
        </div>

        {preferences?.consentGranted && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/40">Model Tier</p>
                <p className="text-white font-mono">{preferences.preferredTier || 'Not set'}</p>
              </div>
              <div>
                <p className="text-white/40">Last Active</p>
                <p className="text-white font-mono">
                  {preferences.lastActive ? timeAgo(preferences.lastActive) : 'Never'}
                </p>
              </div>
            </div>

            {/* Device Status */}
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Status:</span>
                <span className={cn('font-mono', 
                  deviceStatus.status === 'ready' ? 'text-green-400' :
                  deviceStatus.status === 'loading' ? 'text-yellow-400' :
                  deviceStatus.status === 'failed' ? 'text-red-400' :
                  'text-white/40'
                )}>
                  {deviceStatus.status}
                </span>
              </div>
              
              {deviceStatus.vramMB > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">VRAM Detected:</span>
                  <span className="text-white font-mono">{Math.round(deviceStatus.vramMB)} MB</span>
                </div>
              )}
              
              {deviceStatus.progress > 0 && deviceStatus.status !== 'ready' && (
                <div>
                  <div className="flex justify-between text-xs text-white/40 mb-1">
                    <span>Download Progress</span>
                    <span>{Math.round(deviceStatus.progress * 100)}%</span>
                  </div>
                  <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(deviceStatus.progress * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-white/40 text-xs mt-1">{deviceStatus.progressText}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!preferences?.consentGranted && (
          <div className="text-center py-6">
            <Shield className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-sm mb-4">
              Enable local AI inference for faster, more private responses
            </p>
            <Button variant="cyber" size="lg" label="Get Started" onClick={() => setShowConsentDialog(true)} />
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-3 gap-4">
        <BenefitCard
          icon={<Zap className="w-6 h-6 text-yellow-400" />}
          title="3-5x Faster"
          description="Run AI models directly on your device with zero network latency"
        />
        <BenefitCard
          icon={<Shield className="w-6 h-6 text-green-400" />}
          title="Privacy First"
          description="Your conversations stay on your device, never sent to the cloud"
        />
        <BenefitCard
          icon={<Cpu className="w-6 h-6 text-purple-400" />}
          title="Contribute"
          description="Help power distributed AI and make Siddhi smarter for everyone"
        />
      </div>

      {/* Consent Dialog Modal */}
      {showConsentDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowConsentDialog(false)}
              className="absolute top-2 right-2 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <DistributedComputeConsent
              onConsent={handleConsent}
              onProgress={(progress, text) => {
                setDeviceStatus(prev => ({ ...prev, progress, progressText: text }));
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass rounded-xl p-5 border border-white/5">
      <div className="mb-3">{icon}</div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  );
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

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
