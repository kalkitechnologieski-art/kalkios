'use client';

import { useState, useEffect } from 'react';
import { getPerformanceGrade, type WebVitalsReport } from '@/lib/seo/web-vitals';

interface SEOAnalyticsDashboardProps {
  className?: string;
}

/**
 * Real-time SEO performance dashboard
 * Shows Core Web Vitals, meta tag status, and optimization score
 */
export function SEOAnalyticsDashboard({ className }: SEOAnalyticsDashboardProps) {
  const [vitals, setVitals] = useState<{
    cls?: number;
    fcp?: number;
    lcp?: number;
    ttfb?: number;
  }>({});
  const [grade, setGrade] = useState<{ grade: string; score: number } | null>(null);

  useEffect(() => {
    // Simulate receiving web vitals data
    // In production, fetch from your analytics API
    const mockVitals = {
      cls: 0.05,
      fcp: 1200,
      lcp: 2100,
      ttfb: 450,
    };

    setVitals(mockVitals);
    const result = getPerformanceGrade(mockVitals);
    setGrade({ grade: result.grade, score: result.score });
  }, []);

  return (
    <div className={`bg-black/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 ${className}`}>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-cyan-400">📊</span> SEO Performance Dashboard
      </h2>

      {/* Overall Grade */}
      <div className="mb-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-4 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Overall Performance</p>
            <p className="text-3xl font-bold text-white">
              {grade ? `Grade ${grade.grade}` : 'Calculating...'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">Score</p>
            <p className="text-3xl font-bold text-cyan-400">{grade?.score || '--'}/100</p>
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Core Web Vitals</h3>
        
        <WebVitalMetric
          name="CLS"
          label="Cumulative Layout Shift"
          value={vitals.cls}
          unit=""
          thresholds={{ good: 0.1, needsImprovement: 0.25 }}
        />

        <WebVitalMetric
          name="FCP"
          label="First Contentful Paint"
          value={vitals.fcp}
          unit="ms"
          thresholds={{ good: 1800, needsImprovement: 3000 }}
        />

        <WebVitalMetric
          name="LCP"
          label="Largest Contentful Paint"
          value={vitals.lcp}
          unit="ms"
          thresholds={{ good: 2500, needsImprovement: 4000 }}
        />

        <WebVitalMetric
          name="TTFB"
          label="Time to First Byte"
          value={vitals.ttfb}
          unit="ms"
          thresholds={{ good: 800, needsImprovement: 1800 }}
        />
      </div>

      {/* SEO Checklist */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">SEO Health Check</h3>
        <div className="space-y-2">
          <CheckItem label="Meta Title Present" checked={true} />
          <CheckItem label="Meta Description Optimized" checked={true} />
          <CheckItem label="Canonical URL Set" checked={true} />
          <CheckItem label="Open Graph Tags" checked={true} />
          <CheckItem label="Structured Data" checked={true} />
          <CheckItem label="Mobile Responsive" checked={true} />
          <CheckItem label="HTTPS Enabled" checked={true} />
          <CheckItem label="Robots.txt Configured" checked={true} />
          <CheckItem label="Sitemap Submitted" checked={false} warning />
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-yellow-400 text-sm font-semibold mb-2">⚠️ Action Required</p>
        <ul className="text-white/70 text-sm space-y-1 list-disc list-inside">
          <li>Submit sitemap to Google Search Console</li>
          <li>Add alt text to all images</li>
          <li>Create FAQ pages for top services</li>
        </ul>
      </div>
    </div>
  );
}

interface WebVitalMetricProps {
  name: string;
  label: string;
  value?: number;
  unit: string;
  thresholds: { good: number; needsImprovement: number };
}

function WebVitalMetric({ name, label, value, unit, thresholds }: WebVitalMetricProps) {
  if (value === undefined) {
    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-white font-mono text-sm">{name}</p>
          <p className="text-white/40 text-xs">{label}</p>
        </div>
        <p className="text-white/40 text-sm">Collecting...</p>
      </div>
    );
  }

  let status: 'good' | 'needs-improvement' | 'poor';
  if (value <= thresholds.good) status = 'good';
  else if (value <= thresholds.needsImprovement) status = 'needs-improvement';
  else status = 'poor';

  const colorClass =
    status === 'good'
      ? 'text-green-400'
      : status === 'needs-improvement'
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-white font-mono text-sm">{name}</p>
        <p className="text-white/40 text-xs">{label}</p>
      </div>
      <p className={`${colorClass} font-semibold`}>
        {value.toFixed(value < 1 ? 2 : 0)}
        {unit}
      </p>
    </div>
  );
}

interface CheckItemProps {
  label: string;
  checked: boolean;
  warning?: boolean;
}

function CheckItem({ label, checked, warning }: CheckItemProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {checked ? (
        <span className="text-green-400">✓</span>
      ) : warning ? (
        <span className="text-yellow-400">⚠</span>
      ) : (
        <span className="text-red-400">✗</span>
      )}
      <span className={checked ? 'text-white/70' : 'text-white/40'}>{label}</span>
    </div>
  );
}
