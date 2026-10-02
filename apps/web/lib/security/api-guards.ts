// Shared API route guards: session/role verification + fixed-window rate limits.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface ApiUser {
  id: string;
  email?: string;
  role: string;
}

const STAFF_ROLES = ['ceo', 'admin', 'manager', 'developer', 'support', 'hr', 'employee'];

export async function verifySession(req: NextRequest): Promise<ApiUser | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? undefined,
    role: (profile as { role?: string } | null)?.role ?? 'client',
  };
}

export function isResponse(value: ApiUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export function requireRole(user: ApiUser, roles: string[]): NextResponse | null {
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export const requireStaff = (user: ApiUser) => requireRole(user, STAFF_ROLES);
export const requireAdmin = (user: ApiUser) =>
  requireRole(user, ['ceo', 'admin', 'manager']);

// ─── Rate limiting ──────────────────────────────────────────────────
// Fixed-window counters per key. In-memory: correct on a single instance
// (e.g. one long-running Node server); on serverless each cold start resets
// the window, so treat this as a soft cap plus move to Redis when scaling.

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = 0;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    for (const [k, w] of windows) {
      if (w.resetAt <= now) windows.delete(k);
    }
  }

  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (w.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((w.resetAt - now) / 1000) };
  }

  w.count += 1;
  return { ok: true };
}

export function clientKey(req: NextRequest, scope: string): string {
  const fwd = req.headers.get('x-forwarded-for');
  const ip = (fwd ? fwd.split(',')[0].trim() : '') || req.headers.get('x-real-ip') || 'unknown';
  return `${scope}:${ip}`;
}
