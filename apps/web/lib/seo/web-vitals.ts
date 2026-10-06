// == KALKI B6 ENTERPRISE SEO ==
// Core Web Vitals monitoring and reporting
// Critical for Google search ranking
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';

export interface WebVitalsReport {
  name: string;
  value: number;
  id: string;
}

/**
 * API endpoint to receive web vitals from client-side
 * POST /api/analytics/web-vitals
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const vitals: WebVitalsReport[] = body.vitals || [];

    // In production, send to your analytics platform
    // For now, log to console (replace with actual analytics)
    for (const vital of vitals) {
      console.log(`[Web Vitals] ${vital.name}: ${vital.value} (${vital.id})`);

      // Send to your preferred analytics service:
      // - Google Analytics 4
      // - Sentry Performance
      // - Datadog RUM
      // - Custom database
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Web Vitals] Failed to process report:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}

/**
 * Client-side web vitals reporter
 * Use in _app.tsx or layout.tsx
 */
export function reportWebVitals(onReport?: (vital: WebVitalsReport) => void) {
  if (typeof window === 'undefined') return;

  // Import web-vitals library dynamically
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => {
      const report = {
        name: 'CLS',
        value: metric.value,
        id: metric.id,
      };
      sendToAnalytics(report);
      onReport?.(report);
    });

    onFID((metric) => {
      const report = {
        name: 'FID',
        value: metric.value,
        id: metric.id,
      };
      sendToAnalytics(report);
      onReport?.(report);
    });

    onFCP((metric) => {
      const report = {
        name: 'FCP',
        value: metric.value,
        id: metric.id,
      };
      sendToAnalytics(report);
      onReport?.(report);
    });

    onLCP((metric) => {
      const report = {
        name: 'LCP',
        value: metric.value,
        id: metric.id,
      };
      sendToAnalytics(report);
      onReport?.(report);
    });

    onTTFB((metric) => {
      const report = {
        name: 'TTFB',
        value: metric.value,
        id: metric.id,
      };
      sendToAnalytics(report);
      onReport?.(report);
    });
  });
}

async function sendToAnalytics(vital: WebVitalsReport) {
  try {
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vitals: [vital] }),
      keepalive: true,
    });
  } catch {
    // Silently fail - don't break user experience
  }
}

/**
 * Web Vitals thresholds for "Good", "Needs Improvement", "Poor"
 * Based on Google's recommendations
 */
export const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25, poor: Infinity },
  FID: { good: 100, needsImprovement: 300, poor: Infinity },
  FCP: { good: 1800, needsImprovement: 3000, poor: Infinity },
  LCP: { good: 2500, needsImprovement: 4000, poor: Infinity },
  TTFB: { good: 800, needsImprovement: 1800, poor: Infinity },
};

/**
 * Get performance grade based on web vitals
 */
export function getPerformanceGrade(vitals: {
  cls?: number;
  fid?: number;
  fcp?: number;
  lcp?: number;
  ttfb?: number;
}): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  score: number;
  details: Record<string, 'good' | 'needs-improvement' | 'poor'>;
} {
  const details: Record<string, 'good' | 'needs-improvement' | 'poor'> = {};

  function getStatus(value: number, thresholds: { good: number; needsImprovement: number }): 'good' | 'needs-improvement' | 'poor' {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  if (vitals.cls !== undefined) {
    details.CLS = getStatus(vitals.cls, WEB_VITALS_THRESHOLDS.CLS);
  }
  if (vitals.fid !== undefined) {
    details.FID = getStatus(vitals.fid, WEB_VITALS_THRESHOLDS.FID);
  }
  if (vitals.fcp !== undefined) {
    details.FCP = getStatus(vitals.fcp, WEB_VITALS_THRESHOLDS.FCP);
  }
  if (vitals.lcp !== undefined) {
    details.LCP = getStatus(vitals.lcp, WEB_VITALS_THRESHOLDS.LCP);
  }
  if (vitals.ttfb !== undefined) {
    details.TTFB = getStatus(vitals.ttfb, WEB_VITALS_THRESHOLDS.TTFB);
  }

  // Calculate score (0-100)
  const scores = Object.values(details).map((status) => {
    if (status === 'good') return 100;
    if (status === 'needs-improvement') return 50;
    return 0;
  });

  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (avgScore >= 90) grade = 'A';
  else if (avgScore >= 80) grade = 'B';
  else if (avgScore >= 70) grade = 'C';
  else if (avgScore >= 60) grade = 'D';
  else grade = 'F';

  return { grade, score: Math.round(avgScore), details };
}
