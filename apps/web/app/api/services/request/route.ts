// == KALKI SERVICE REQUESTS ==
// No-payment, integrated form submission for any service. Creates an order +
// project atomically via the create_service_request RPC (service_role).
// Guests are allowed; a logged-in user is linked to their profile.
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit, clientKey } from '@/lib/security/api-guards';
import { sendServiceRequestConfirmation } from '@/lib/email/send';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SERVICES = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RequestBody {
  serviceIds?: unknown;
  buyerName?: unknown;
  buyerEmail?: unknown;
  buyerPhone?: unknown;
  company?: unknown;
  requirements?: unknown;
  budget?: unknown;
  timeline?: unknown;
}

export async function POST(req: NextRequest) {
  try {
    // Soft abuse guard for a public form.
    const rl = rateLimit(clientKey(req, 'service-request'), 8, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
      );
    }

    const body = (await req.json().catch(() => null)) as RequestBody | null;
    if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

    // Accept a single serviceId or an array; dedupe + bound the count.
    const rawIds = Array.isArray(body.serviceIds) ? body.serviceIds : [body.serviceIds];
    const serviceIds = Array.from(
      new Set((rawIds ?? []).filter((v): v is string => typeof v === 'string' && v.length > 0))
    );
    if (serviceIds.length === 0) {
      return NextResponse.json({ error: 'Please select at least one service.' }, { status: 400 });
    }
    if (serviceIds.length > MAX_SERVICES) {
      return NextResponse.json({ error: `Too many services (max ${MAX_SERVICES}).` }, { status: 400 });
    }

    const buyerName = String(body.buyerName ?? '').trim();
    const buyerEmail = String(body.buyerEmail ?? '').trim().toLowerCase();
    const buyerPhone = String(body.buyerPhone ?? '').trim();

    if (buyerName.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(buyerEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (!/^[0-9+\-\s()]{7,15}$/.test(buyerPhone)) {
      return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
    }

    const clamp = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : null);
    const company = clamp(body.company, 160);
    const requirements = clamp(body.requirements, 4000);
    const budget = clamp(body.budget, 80);
    const timeline = clamp(body.timeline, 80);

    // Optional login linkage — never block a guest.
    let clientId: string | null = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      clientId = data.user?.id ?? null;
    } catch {
      /* guest submission */
    }

    const admin = (await createAdminClient()) as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };

    const created: Array<{ orderId: string; projectId: string; serviceName: string }> = [];
    for (const serviceId of serviceIds) {
      const { data, error } = await admin.rpc('create_service_request', {
        p_service_id: serviceId,
        p_client_id: clientId,
        p_buyer_name: buyerName,
        p_buyer_email: buyerEmail,
        p_buyer_phone: buyerPhone,
        p_company: company,
        p_requirements: requirements,
        p_budget: budget,
        p_timeline: timeline,
      });
      if (error) {
        logger.error('[ServiceRequest] RPC failed', { serviceId, error: error.message });
        return NextResponse.json(
          { error: 'We could not submit your request right now. Please try again.' },
          { status: 502 }
        );
      }
      const r = (data ?? {}) as { order_id?: string; project_id?: string; service_name?: string };
      created.push({
        orderId: r.order_id ?? '',
        projectId: r.project_id ?? '',
        serviceName: r.service_name ?? 'Service',
      });
    }

    if (created.length === 0) {
      return NextResponse.json({ error: 'No valid service could be submitted.' }, { status: 400 });
    }

    // Best-effort confirmation email; never fail the request over it.
    void sendServiceRequestConfirmation({
      to: buyerEmail,
      buyerName,
      serviceName: created.map((c) => c.serviceName).join(', '),
      projectId: created[0].projectId,
    }).catch(() => { /* already logged inside */ });

    logger.info('[ServiceRequest] created', { count: created.length, clientId });

    return NextResponse.json({
      ok: true,
      requestId: created[0].orderId,
      projectId: created[0].projectId,
      services: created,
    });
  } catch (err) {
    logger.error('[ServiceRequest] unhandled', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
