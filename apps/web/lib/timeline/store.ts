// == KALKI B3 COMMAND ==
// Timeline CRUD + realtime subscription.
// -----------------------------------------------------------------------------

import { createClient } from '@/lib/supabase/client';
import type { TimelinePost, TimelinePostType, TimelineVisibility } from './types';

export interface CreateTimelinePostArgs {
  projectId?: string;
  orderId?: string;
  postType: TimelinePostType;
  content: string;
  visibility?: TimelineVisibility;
  milestoneId?: string;
  metadata?: Record<string, unknown>;
  mediaUrls?: string[];
}

export async function createTimelinePost(args: CreateTimelinePostArgs): Promise<TimelinePost | null> {
  const supabase = createClient() as unknown as {
    auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
    from: (t: string) => {
      insert: (row: unknown) => {
        select: () => { single: () => Promise<{ data: unknown; error: unknown }> };
      };
    };
  };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('timeline_posts')
    .insert({
      project_id: args.projectId ?? null,
      order_id: args.orderId ?? null,
      author_id: auth.user.id,
      post_type: args.postType,
      content: args.content,
      visibility: args.visibility ?? 'client',
      milestone_id: args.milestoneId ?? null,
      metadata: args.metadata ?? {},
    })
    .select()
    .single();

  if (error) return null;
  const post = data as TimelinePost;

  if (args.mediaUrls && args.mediaUrls.length > 0) {
    const supabaseRaw = createClient() as unknown as {
      from: (t: string) => { insert: (row: unknown[]) => Promise<unknown> };
    };
    await supabaseRaw.from('timeline_media').insert(
      args.mediaUrls.map((url, i) => ({
        post_id: post.id,
        url,
        order_index: i,
      }))
    );
  }

  return post;
}

export async function listTimelinePosts(args: {
  projectId?: string;
  orderId?: string;
  visibility?: TimelineVisibility;
  limit?: number;
}): Promise<TimelinePost[]> {
  const supabase = createClient() as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c: string, v: unknown) => {
          order: (c: string, o: { ascending: boolean }) => {
            limit: (n: number) => Promise<{ data: unknown[] | null; error: unknown }>;
          };
        };
        order: (c: string, o: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: unknown[] | null; error: unknown }>;
        };
      };
    };
  };

  let query = supabase.from('timeline_posts').select('*');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chain: any = query;

  if (args.projectId) chain = chain.eq('project_id', args.projectId);
  if (args.orderId) chain = chain.eq('order_id', args.orderId);
  if (args.visibility) chain = chain.eq('visibility', args.visibility);

  const { data, error } = await chain.order('created_at', { ascending: false }).limit(args.limit ?? 50);
  if (error) return [];
  return (data ?? []) as TimelinePost[];
}

export function subscribeTimeline(
  filter: { projectId?: string; orderId?: string },
  onChange: (post: TimelinePost) => void
): () => void {
  const supabase = createClient() as unknown as {
    channel: (name: string) => {
      on: (
        event: string,
        opts: Record<string, unknown>,
        cb: (payload: { new: TimelinePost }) => void
      ) => { subscribe: () => unknown };
    };
  };

  const name = `timeline:${filter.projectId ?? filter.orderId ?? 'all'}`;
  const channel = supabase
    .channel(name)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'timeline_posts',
        ...(filter.projectId ? { filter: `project_id=eq.${filter.projectId}` } : {}),
        ...(filter.orderId ? { filter: `order_id=eq.${filter.orderId}` } : {}),
      },
      (payload) => onChange(payload.new as TimelinePost)
    )
    .subscribe();

  return () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { (channel as any).unsubscribe?.(); } catch { /* ignore */ }
  };
}

export async function reactToPost(postId: string, emoji: string): Promise<void> {
  const supabase = createClient() as unknown as {
    auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
    from: (t: string) => { insert: (row: unknown) => Promise<unknown> };
  };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  try {
    await supabase.from('timeline_reactions').insert({
      post_id: postId,
      user_id: auth.user.id,
      emoji,
    });
  } catch { /* unique constraint may fire */ }
}
