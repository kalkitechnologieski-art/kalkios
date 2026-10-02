// == KALKI B2 ENGINES ==
// Apply wallet balance at checkout.
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { Wallet } from 'lucide-react';

interface WalletToggleProps {
  balance: number;
  maxApplicable: number;
  onChange: (amount: number) => void;
}

export function WalletToggle({ balance, maxApplicable, onChange }: WalletToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const applicable = Math.min(balance, maxApplicable);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    onChange(next ? applicable : 0);
  };

  if (balance <= 0) return null;

  return (
    <div className="flex items-center justify-between bg-cyan-500/5 border border-cyan-500/20 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-cyan-400" />
        <span className="text-white/80 text-sm">Use wallet balance</span>
        <span className="text-cyan-400 text-xs font-mono">₹{balance.toLocaleString('en-IN')}</span>
      </div>
      <button
        onClick={toggle}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
          enabled ? 'bg-cyan-600' : 'bg-white/20'
        }`}
        aria-label="Toggle wallet"
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
