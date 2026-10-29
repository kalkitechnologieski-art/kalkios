// == KALKI INBOUND ENQUIRIES ==
// Public lead intake for /contact and the quote CTAs. Writes go through the
// capture_inquiry RPC (service_role) so the table itself stays unreadable and
// unwritable to visitors. If the intake table has not been migrated yet, the
// response hands the visitor a direct contact path instead of losing the lead.
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { clientKey, rateLimit } from '@/lib/security/api-guards';
import { sendInquiryAck, sendInquiryToFounder } from '@/lib/email/inquiries';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCES = ['contact_page', 'quote_page', 'product_page', 'whatsapp', 'footer'];

// A lead is the expensive part of this flow: whenever intake cannot be trusted,
// the response carries a direct contact path so the form can show it instead of
// leaving the visitor with a dead error message.
const INTAKE_FAILED = 'We could not save your enquiry just now. Reach us directly and we will reply within 24 hours.';
const FALLBACK = { email: 'ceo@kalki-intelligence.in', phone: '+91 62610 31710' };

interface InquiryBody {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  serviceInterest?: unknown;
  budgetRange?: unknown;
  timeline?: unknown;
  message?: unknown;
  source?: unknown;
  // Honeypot: real browsers never fill a field they cannot see.
  website?: unknown;
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(clientKey(req, 'inquiry'), 6, 600_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many enquiries from this device. Please wait a while or email us directly.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const body = (await req.json().catch(() => null)) as InquiryBody | null;
    if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

    if (text(body.website, 10)) {
      // Bot: pretend success, store nothing.
      return NextResponse.json({ ok: true, refCode: `INQ-${Math.random().toString(36).slice(2, 10).toUpperCase()}` });
    }

    const name = text(body.name, 120);
    const email = text(body.email, 254)?.toLowerCase() ?? null;
    const phone = text(body.phone, 20);
    const message = text(body.message, 4000);

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      return NextResponse.json({ error: 'Please enter a reachable phone number.' }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: 'Please add a line or two about what you need.' }, { status: 400 });
    }

    const source = SOURCES.includes(String(body.source ?? '')) ? String(body.source) : 'contact_page';

    const intake = await captureInquiry({
      name,
      email,
      phone,
      company: text(body.company, 160),
      serviceInterest: text(body.serviceInterest, 160),
      budgetRange: text(body.budgetRange, 80),
      timeline: text(body.timeline, 80),
      message,
      source,
    });

    if (!intake.ok) {
      logger.error('[Inquiry] intake failed', intake.detail);
      return NextResponse.json({ error: INTAKE_FAILED, fallback: FALLBACK }, { status: 502 });
    }

    const { refCode } = intake;

    void sendInquiryAck({ to: email, name, refCode, serviceInterest: text(body.serviceInterest, 160) })
      .catch((err) => logger.warn('[Inquiry] ack email failed', err));
    void sendInquiryToFounder({
      name,
      email,
      phone,
      company: text(body.company, 160),
      serviceInterest: text(body.serviceInterest, 160),
      budgetRange: text(body.budgetRange, 80),
      timeline: text(body.timeline, 80),
      message,
      source,
      refCode,
    }).catch((err) => logger.warn('[Inquiry] founder email failed', err));

    logger.info('[Inquiry] captured', { source, hasPhone: Boolean(phone) });

    return NextResponse.json({ ok: true, refCode });
  } catch (err) {
    logger.error('[Inquiry] unhandled', err);
    return NextResponse.json({ error: INTAKE_FAILED, fallback: FALLBACK }, { status: 502 });
  }
}

interface IntakeArgs {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  serviceInterest: string | null;
  budgetRange: string | null;
  timeline: string | null;
  message: string;
  source: string;
}

type IntakeResult = { ok: true; refCode: string | null } | { ok: false; detail: Record<string, unknown> };

// capture_inquiry is SECURITY DEFINER: visitors hold no table grant, only EXECUTE.
async function captureInquiry(args: IntakeArgs): Promise<IntakeResult> {
  try {
    const admin = (await createAdminClient()) as unknown as {
      rpc: (fn: string, fnArgs: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;
    };

    const { data, error } = await admin.rpc('capture_inquiry', {
      p_name: args.name,
      p_email: args.email,
      p_phone: args.phone,
      p_company: args.company,
      p_service_interest: args.serviceInterest,
      p_budget_range: args.budgetRange,
      p_timeline: args.timeline,
      p_message: args.message,
      p_source: args.source,
    });

    if (error) return { ok: false, detail: { message: error.message, code: error.code } };

    // capture_inquiry returns table(id, ref_code) — Postgres surfaces it as rows.
    const first = Array.isArray(data) ? (data[0] as { ref_code?: string } | undefined)
      : (data as { ref_code?: string } | undefined);
    return { ok: true, refCode: first?.ref_code ?? null };
  } catch (err) {
    return { ok: false, detail: { message: err instanceof Error ? err.message : String(err) } };
  }
}
