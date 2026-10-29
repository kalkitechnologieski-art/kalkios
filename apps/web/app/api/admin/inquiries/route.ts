// Admin inbox for inbound enquiries. Runs on the session client so the
// inquiries_admin_read / inquiries_admin_write RLS policies stay authoritative.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clientKey, isResponse, rateLimit, requireAdmin, verifySession } from '@/lib/security/api-guards';
import { logger } from '@/lib/utils/logger';

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost', 'spam'] as const;
type Status = (typeof STATUSES)[number];

async function guard(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;
  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;
  const limit = rateLimit(clientKey(req, 'admin-inquiries'), 120, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  return user;
}

export async function GET(req: NextRequest) {
  const user = await guard(req);
  if (isResponse(user)) return user;
  try {
    const params = new URL(req.url).searchParams;
    const status = params.get('status');
    const search = (params.get('q') ?? '').trim().slice(0, 80);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    let query = supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (status && (STATUSES as readonly string[]).includes(status)) {
      query = query.eq('status', status as Status);
    }
    if (search) {
      const like = `%${search.replace(/[,()%]/g, '')}%`;
      query = query.or(`name.ilike.${like},email.ilike.${like},company.ilike.${like},ref_code.ilike.${like}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ inquiries: data ?? [] });
  } catch (e) {
    logger.error('[AdminInquiries] GET failed', e);
    return NextResponse.json(
      { error: 'Could not load the inbox. Apply supabase/migrations/20261029000003_inquiries.sql first.' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const user = await guard(req);
  if (isResponse(user)) return user;
  try {
    const body = (await req.json().catch(() => null)) as { id?: unknown; status?: unknown; notes?: unknown } | null;
    const id = typeof body?.id === 'string' ? body.id : null;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body?.status !== undefined) {
      if (!(STATUSES as readonly string[]).includes(String(body.status))) {
        return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
      }
      patch.status = String(body.status) as Status;
    }
    if (body?.notes !== undefined) {
      patch.admin_notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data, error } = await supabase.from('inquiries').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json({ success: true, inquiry: data });
  } catch (e) {
    logger.error('[AdminInquiries] PATCH failed', e);
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 });
  }
}
