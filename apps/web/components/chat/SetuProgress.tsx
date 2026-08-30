"use client";

import { Download, Loader2, Check } from "lucide-react";

export function SetuProgress({ leads, csv, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Searching for leads...</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  if (!leads || leads.length === 0) return null;

  const downloadCSV = () => {
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Check className="w-4 h-4 text-green-400" />
          <span>Found {leads.length} leads</span>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 rounded-lg text-cyan-400 text-sm transition"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>
    </div>
  );
}
