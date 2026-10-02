// == KALKI B3 COMMAND ==
// Timeline API: POST create · GET list · DELETE (admin/author only).
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user as { id: string } | null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = (profile as { role?: string } | null)?.role ?? 'client';
    const isStaff = ['ceo', 'admin', 'manager', 'developer', 'support', 'hr', 'employee'].includes(role);

    const sp = req.nextUrl.searchParams;
    const projectId = sp.get('projectId');
    const orderId = sp.get('orderId');
    if (!projectId && !orderId) {
      return NextResponse.json({ error: 'projectId or orderId required' }, { status: 400 });
    }

    if (!isStaff) {
      // Clients may only view the timeline of a project/order they own.
      let ownerId: string | null = null;
      if (projectId) {
        const { data: project } = await supabase
          .from('projects')
          .select('client_id')
          .eq('id', projectId)
          .maybeSingle();
        ownerId = (project as { client_id?: string } | null)?.client_id ?? null;
      } else {
        const { data: order } = await supabase
          .from('orders')
          .select('client_id')
          .eq('id', orderId)
          .maybeSingle();
        ownerId = (order as { client_id?: string } | null)?.client_id ?? null;
      }
      if (ownerId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let q = supabase.from('timeline_posts').select('*');
    if (projectId) q = q.eq('project_id', projectId);
    if (orderId) q = q.eq('order_id', orderId);
    if (!isStaff) q = q.eq('visibility', 'client');
    const { data } = await q.order('created_at', { ascending: false }).limit(50);

    return NextResponse.json({ posts: data ?? [] });
  } catch (error) {
    logger.error('[Timeline] GET failed', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user as { id: string } | null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = (await req.json()) as {
      projectId?: string;
      orderId?: string;
      postType: string;
      content: string;
      visibility?: 'client' | 'admin';
      metadata?: Record<string, unknown>;
    };

    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const { data } = await supabase
      .from('timeline_posts')
      .insert({
        project_id: body.projectId ?? null,
        order_id: body.orderId ?? null,
        author_id: user.id,
        post_type: body.postType ?? 'update',
        content: body.content.trim(),
        visibility: body.visibility ?? 'client',
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    // Audit log
    await supabase.from('admin_actions').insert({
      actor_id: user.id,
      action: 'timeline_post_create',
      target_table: 'timeline_posts',
      target_id: data?.id ?? null,
      payload: { post_type: body.postType, visibility: body.visibility },
    });

    return NextResponse.json({ post: data });
  } catch (error) {
    logger.error('[Timeline] POST failed', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user as { id: string } | null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await supabase.from('timeline_posts').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Timeline] DELETE failed', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
