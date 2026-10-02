/**
 * SIDDHI v4.0 — Distributed Compute Management API
 * 
 * Manages user consent, device status, and peer pool registration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession, isResponse } from '@/lib/security/api-guards';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/distributed
 * Returns user's distributed compute preferences and device status
 */
export async function GET(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;

  try {
    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('distributed_compute_consent, distributed_compute_tier, distributed_compute_last_active')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      consentGranted: profile?.distributed_compute_consent ?? false,
      preferredTier: profile?.distributed_compute_tier ?? null,
      lastActive: profile?.distributed_compute_last_active ?? null,
    });
  } catch (err) {
    console.error('[Distributed] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/distributed
 * Update user's distributed compute consent and preferences
 */
export async function POST(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;

  try {
    const body = await req.json();
    const { consent, tier } = body;

    if (typeof consent !== 'boolean') {
      return NextResponse.json(
        { error: 'consent must be a boolean' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any;
    const { error } = await supabase
      .from('profiles')
      .update({
        distributed_compute_consent: consent,
        distributed_compute_tier: tier || null,
        distributed_compute_last_active: consent ? new Date().toISOString() : null,
      })
      .eq('id', user.id);

    if (error) {
      console.error('[Distributed] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, consent });
  } catch (err) {
    console.error('[Distributed] POST error:', err);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
