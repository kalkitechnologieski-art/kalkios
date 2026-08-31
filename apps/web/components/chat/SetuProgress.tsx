'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronRight, Download } from 'lucide-react';

interface Lead {
  name: string;
  email: string;
  company: string;
  confidence: number;
}

interface SetuProgressProps {
  leads: Lead[];
  csv: string;
  isLoading: boolean;
  progress?: number;
  statusMessage?: string;
  steps?: Array<{ label: string; status: 'pending' | 'active' | 'completed' | 'error' }>;
}

export function SetuProgress({ leads, csv, isLoading, progress = 0, statusMessage = '', steps = [] }: SetuProgressProps) {
  const [expanded, setExpanded] = useState(true);

  const downloadCSV = () => {
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 space-y-3 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
          <span className="text-sm text-white/60 font-mono">
            {isLoading ? 'Searching for leads...' : `Found ${leads.length} leads`}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-white/30 hover:text-white/60 transition"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Progress bar */}
      {isLoading && (
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Status message */}
      {statusMessage && isLoading && (
        <p className="text-xs text-cyan-400/40 font-mono animate-pulse">{statusMessage}</p>
      )}

      {/* Steps trace */}
      <AnimatePresence>
        {expanded && steps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 mt-2 pt-2 border-t border-cyan-500/5"
          >
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-white/40 font-mono">
                {step.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-400" />}
                {step.status === 'active' && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
                {step.status === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
                {step.status === 'pending' && <span className="w-3 h-3 rounded-full border border-white/20" />}
                <span className={step.status === 'active' ? 'text-cyan-400' : ''}>{step.label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leads preview */}
      {!isLoading && leads.length > 0 && (
        <div className="space-y-1">
          {leads.slice(0, 3).map((lead, idx) => (
            <div key={idx} className="flex justify-between text-xs text-white/60 border-b border-white/5 pb-1">
              <span>{lead.name || 'Unknown'}</span>
              <span>{lead.company || '-'}</span>
              <span className="text-cyan-400/40">{Math.round(lead.confidence * 100)}%</span>
            </div>
          ))}
          {leads.length > 3 && (
            <p className="text-[10px] text-white/30">+{leads.length - 3} more</p>
          )}
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-lg text-cyan-400 text-sm transition mt-2"
          >
            <Download className="w-4 h-4" />
            Download CSV ({leads.length} leads)
          </button>
        </div>
      )}
    </div>
  );
}
