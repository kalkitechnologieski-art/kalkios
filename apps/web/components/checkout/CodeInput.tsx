// == KALKI B2 ENGINES ==
// Checkout code input with validation + apply.
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { Tag, X, Loader2, Check } from 'lucide-react';
import { useCodes } from '@/hooks/useCodes';

interface CodeInputProps {
  orderAmount: number;
  onChange: (discount: number) => void;
}

export function CodeInput({ orderAmount, onChange }: CodeInputProps) {
  const [input, setInput] = useState('');
  const { applied, loading, error, validate, clear } = useCodes();

  const handleApply = async () => {
    const result = await validate(input, orderAmount);
    if (result) onChange(result.amount);
  };

  const handleClear = () => {
    clear();
    setInput('');
    onChange(0);
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <Check className="w-4 h-4" />
          <span className="font-mono">{applied.code}</span>
          <span className="text-xs">− ₹{applied.amount.toLocaleString('en-IN')}</span>
        </div>
        <button onClick={handleClear} className="text-green-400/60 hover:text-green-400" aria-label="Remove code">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/40" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Promo code"
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg pl-10 pr-3 py-2 text-white text-sm font-mono uppercase outline-none focus:border-cyan-500/50"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm font-mono transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
    </div>
  );
}
