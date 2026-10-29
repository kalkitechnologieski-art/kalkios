// Admin-only CRUD for published testimonials (the social-proof strip on
// marketing pages). Writes go through the session client so Postgres RLS stays
// the final authority on who may edit.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clientKey, isResponse, rateLimit, requireAdmin, verifySession } from '@/lib/security/api-guards';
import { logger } from '@/lib/utils/logger';

const QUOTE_MIN = 20;
const QUOTE_MAX = 900;

async function guard(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;
  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;
  const limit = rateLimit(clientKey(req, 'admin-testimonials'), 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    );
  }
  return user;
}

function clamp(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, max);
}

function validateBody(body: Record<string, unknown>) {
  const quote = clamp(body.quote, QUOTE_MAX) ?? '';
  if (quote.length < QUOTE_MIN) return { error: `Quote must be at least ${QUOTE_MIN} characters.` };

  const authorName = clamp(body.authorName, 120);
  if (!authorName) return { error: 'Author name is required.' };

  const ratingRaw = body.rating === undefined || body.rating === null ? 5 : Number(body.rating);
  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) return { error: 'Rating must be 1-5.' };

  return {
    value: {
      author_name: authorName,
      author_role: clamp(body.authorRole, 120),
      author_company: clamp(body.authorCompany, 160),
      city: clamp(body.city, 80),
      quote,
      rating: ratingRaw,
      project_ref: clamp(body.projectRef, 60),
      is_approved: body.isApproved !== false,
      sort_order: Number.isInteger(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      service_id: clamp(body.serviceId, 64),
    },
  };
}

export async function GET(req: NextRequest) {
  const user = await guard(req);
  if (isResponse(user)) return user;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('is_approved', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ testimonials: data ?? [] });
  } catch (e) {
    logger.error('[AdminTestimonials] GET failed', e);
    return NextResponse.json({ error: 'Could not load testimonials. Has the testimonials migration been applied?' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await guard(req);
  if (isResponse(user)) return user;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const parsed = validateBody(body);
    if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data, error } = await supabase
      .from('testimonials')
      .insert(parsed.value)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, testimonial: data });
  } catch (e) {
    logger.error('[AdminTestimonials] POST failed', e);
    return NextResponse.json({ error: 'Failed to save testimonial' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await guard(req);
  if (isResponse(user)) return user;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const id = clamp(body.id, 64);
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (body.isApproved !== undefined) patch.is_approved = Boolean(body.isApproved);
    if (body.sortOrder !== undefined) patch.sort_order = Number.isInteger(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;
    if (body.quote !== undefined || body.authorName !== undefined) {
      const parsed = validateBody(body);
      if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
      Object.assign(patch, parsed.value);
    }
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data, error } = await supabase.from('testimonials').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, testimonial: data });
  } catch (e) {
    logger.error('[AdminTestimonials] PATCH failed', e);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await guard(req);
  if (isResponse(user)) return user;
  try {
    const id = clamp(new URL(req.url).searchParams.get('id'), 64);
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e) {
    logger.error('[AdminTestimonials] DELETE failed', e);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
