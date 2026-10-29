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
      from: (t: string) => any;
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };

    // Validate the requested ids against live services first, so a stale or
    // demo-catalog id degrades to a real enquiry instead of a cryptic 500.
    // Postgres rejects a non-UUID in an `id` comparison outright, so screen those
    // out before querying.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const lookupIds = serviceIds.filter((id) => UUID_RE.test(id));

    const catalog = new Map<string, { id: string; name: string; price: number | null }>();
    if (lookupIds.length > 0) {
      const { data: validData, error: validError } = await admin
        .from('services')
        .select('id, name, price')
        .in('id', lookupIds)
        .eq('is_active', true);
      if (validError) {
        logger.error('[ServiceRequest] service validation failed', { error: validError.message });
        return NextResponse.json(
          { error: 'We could not submit your request right now. Please try again.' },
          { status: 502 }
        );
      }
      for (const row of (validData ?? []) as { id: string; name: string; price: number | null }[]) {
        catalog.set(row.id, row);
      }
    }
    const ids = serviceIds.filter((id) => catalog.has(id));

    const rpcArgs = {
      p_client_id: clientId,
      p_buyer_name: buyerName,
      p_buyer_email: buyerEmail,
      p_buyer_phone: buyerPhone,
      p_company: company,
      p_requirements: requirements,
      p_budget: budget,
      p_timeline: timeline,
    };

    const created: Array<{ orderId: string; projectId: string; serviceName: string }> = [];
    const failed: string[] = [];
    let rpcError = '';

    for (const serviceId of ids) {
      const { data, error } = await admin.rpc('create_service_request', { ...rpcArgs, p_service_id: serviceId });
      if (error) {
        rpcError = error.message;
        logger.error('[ServiceRequest] RPC failed', { serviceId, error: error.message });
        failed.push(serviceId);
        if (created.length === 0) continue; // try the direct-intake fallback below
        break;
      }
      const r = (data ?? {}) as { order_id?: string; project_id?: string; service_name?: string };
      created.push({
        orderId: r.order_id ?? '',
        projectId: r.project_id ?? '',
        serviceName: r.service_name ?? catalog.get(serviceId)?.name ?? 'Service',
      });
    }

    // The RPC needs migrations the database may not have applied yet. A lead is
    // the expensive part of this flow, so capture the order directly rather
    // than sending the client away with an error.
    if (created.length === 0 && failed.length > 0) {
      logger.warn('[ServiceRequest] falling back to direct order intake', { rpcError });
      for (const serviceId of failed) {
        const row = await insertOrderDirectly(admin, serviceId, catalog.get(serviceId), rpcArgs);
        if (row) created.push(row);
      }
    }

    // Nothing they picked resolves to a live service: still capture the enquiry,
    // unscoped, rather than losing the contact details.
    if (created.length === 0 && ids.length === 0) {
      const row = await insertOrderDirectly(admin, null, undefined, rpcArgs);
      if (row) created.push(row);
    }

    if (created.length === 0) {
      logger.error('[ServiceRequest] intake failed completely', { rpcError });
      return NextResponse.json(
        {
          error: 'We could not submit your request right now. Please try again, or email ceo@kalki-intelligence.in.',
          detail: process.env.NODE_ENV === 'production' ? undefined : rpcError,
        },
        { status: 502 }
      );
    }

    // Best-effort confirmation email; never fail the request over it.
    void sendServiceRequestConfirmation({
      to: buyerEmail,
      buyerName,
      serviceName: created.map((c) => c.serviceName).join(', '),
      projectId: created[0].projectId,
    }).catch(() => { /* already logged inside */ });

    logger.info('[ServiceRequest] created', { count: created.length, failed: failed.length, clientId });

    return NextResponse.json({
      ok: true,
      requestId: created[0].orderId,
      projectId: created[0].projectId,
      services: created,
      partial: created.length < serviceIds.length,
      submitted: created.length,
      total: serviceIds.length,
    });
  } catch (err) {
    logger.error('[ServiceRequest] unhandled', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

interface RpcArgs {
  p_client_id: string | null;
  p_buyer_name: string;
  p_buyer_email: string;
  p_buyer_phone: string;
  p_company: string | null;
  p_requirements: string | null;
  p_budget: string | null;
  p_timeline: string | null;
}

// Mirrors the request columns. Falls back to the pre-2026-10 column set when the
// request-form migration has not been applied, so intake survives either schema.
async function insertOrderDirectly(
  admin: { from: (t: string) => any },
  serviceId: string | null,
  service: { name: string; price: number | null } | undefined,
  args: RpcArgs
): Promise<{ orderId: string; projectId: string; serviceName: string } | null> {
  const base = {
    client_id: args.p_client_id,
    service_id: serviceId,
    amount: service?.price ?? 0,
    status: 'submitted',
    buyer_name: args.p_buyer_name,
    buyer_email: args.p_buyer_email,
    buyer_phone: args.p_buyer_phone,
  };

  const attempts = [
    {
      ...base,
      company: args.p_company,
      requirements: args.p_requirements,
      brief: args.p_requirements,
      budget: args.p_budget,
      timeline: args.p_timeline,
      source: 'form',
    },
    base,
  ];

  for (const values of attempts) {
    const { data, error } = await admin.from('orders').insert(values).select('id').single();
    if (!error && data) {
      const orderId = String((data as { id: string }).id);
      const projectId = await createProjectForOrder(admin, orderId, service?.name, args);
      return { orderId, projectId, serviceName: service?.name ?? 'Service enquiry' };
    }
    logger.warn('[ServiceRequest] direct insert attempt failed', { error: error?.message });
  }
  return null;
}

async function createProjectForOrder(
  admin: { from: (t: string) => any },
  orderId: string,
  serviceName: string | undefined,
  args: RpcArgs
): Promise<string> {
  const { data, error } = await admin.from('projects').insert({
    order_id: orderId,
    name: `${serviceName ?? 'Service request'} for ${args.p_buyer_name}`,
    description: args.p_requirements ?? 'New service request via KALKI marketplace.',
    status: 'not_started',
    client_id: args.p_client_id,
  }).select('id').single();
  if (error || !data) return '';
  return String((data as { id: string }).id);
}
