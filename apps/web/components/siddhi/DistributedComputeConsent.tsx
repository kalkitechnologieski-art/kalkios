'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Shield, X, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDeviceState, probeDevice, DeviceTier } from '@/lib/ai';

interface Props {
  onConsent: (granted: boolean) => void;
  onProgress?: (progress: number, text: string) => void;
}

export function DistributedComputeConsent({ onConsent, onProgress }: Props) {
  const [step, setStep] = useState<'intro' | 'probing' | 'consent' | 'downloading'>('intro');
  const [deviceCapable, setDeviceCapable] = useState(false);
  const [recommendedTier, setRecommendedTier] = useState<DeviceTier>('compact');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step === 'probing') {
      void probeDevice().then(result => {
        setDeviceCapable(result.capable);
        setRecommendedTier(result.tier);
        setStep(result.capable ? 'consent' : 'intro');
        if (!result.capable) {
          setError('Your device does not support WebGPU acceleration. Siddhi will use cloud inference.');
        }
      });
    }
  }, [step]);

  const handleAccept = async () => {
    setStep('downloading');
    // The actual download happens in the orchestrator; this just tracks UI state
    const interval = setInterval(() => {
      const state = getDeviceState();
      setProgress(state.progress);
      setProgressText(state.progressText);
      onProgress?.(state.progress, state.progressText);
      
      if (state.status === 'ready') {
        clearInterval(interval);
        onConsent(true);
      } else if (state.status === 'failed') {
        clearInterval(interval);
        setError('Model download failed. Falling back to cloud inference.');
        onConsent(false);
      }
    }, 500);
  };

  const handleDecline = () => {
    onConsent(false);
  };

  return (
    <AnimatePresence mode="wait">
      {step === 'intro' && (
        <motion.div
          key="intro"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass-strong rounded-2xl p-6 max-w-md mx-auto border border-cyan-500/20"
        >
          <div className="text-center mb-4">
            <Cpu className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Enhance Siddhi AI</h3>
            <p className="text-white/60 text-sm">
              Run AI models directly on your device for faster, private responses
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <BenefitRow icon={<Zap className="w-4 h-4 text-yellow-400" />} text="3-5x faster response times" />
            <BenefitRow icon={<Shield className="w-4 h-4 text-green-400" />} text="Your data stays on your device" />
            <BenefitRow icon={<Cpu className="w-4 h-4 text-purple-400" />} text="Help power distributed AI for everyone" />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              label="Maybe Later"
              onClick={handleDecline}
              className="flex-1"
            />
            <Button
              variant="cyber"
              size="lg"
              label="Learn More"
              onClick={() => setStep('probing')}
              className="flex-1"
            />
          </div>
        </motion.div>
      )}

      {step === 'consent' && (
        <motion.div
          key="consent"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-strong rounded-2xl p-6 max-w-md mx-auto border border-cyan-500/20"
        >
          <div className="text-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Device Compatible!</h3>
            <p className="text-white/60 text-sm">
              We recommend the <span className="text-cyan-400 font-mono">{recommendedTier}</span> model ({getTierSize(recommendedTier)})
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Model Size:</span>
              <span className="text-white font-mono">{getTierSize(recommendedTier)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">VRAM Required:</span>
              <span className="text-white font-mono">{getTierVRAM(recommendedTier)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Download Time:</span>
              <span className="text-white font-mono">~{getTierDownloadTime(recommendedTier)}</span>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-6 text-xs text-white/70">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            You can disable this anytime in Settings. Your contribution helps make Siddhi smarter for everyone.
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              label="Use Cloud Only"
              onClick={handleDecline}
              className="flex-1"
            />
            <Button
              variant="cyber"
              size="lg"
              label="Enable Local AI"
              onClick={handleAccept}
              className="flex-1"
            />
          </div>
        </motion.div>
      )}

      {step === 'downloading' && (
        <motion.div
          key="downloading"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-2xl p-6 max-w-md mx-auto border border-cyan-500/20"
        >
          <div className="text-center mb-6">
            <Download className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-xl font-bold text-white mb-2">Downloading AI Model</h3>
            <p className="text-white/60 text-sm font-mono">{progressText || 'Initializing...'}</p>
          </div>

          <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-4">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex justify-between text-xs text-white/40 font-mono">
            <span>{Math.round(progress * 100)}% complete</span>
            <span>Please keep this tab open</span>
          </div>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {error}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BenefitRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/80">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function getTierSize(tier: DeviceTier): string {
  const sizes: Record<DeviceTier, string> = {
    compact: '~500 MB',
    fast: '~1.1 GB',
    deep: '~2.2 GB',
  };
  return sizes[tier];
}

function getTierVRAM(tier: DeviceTier): string {
  const vrams: Record<DeviceTier, string> = {
    compact: '4 GB',
    fast: '8 GB',
    deep: '16 GB',
  };
  return vrams[tier];
}

function getTierDownloadTime(tier: DeviceTier): string {
  const times: Record<DeviceTier, string> = {
    compact: '2-5 min',
    fast: '5-10 min',
    deep: '10-20 min',
  };
  return times[tier];
}
