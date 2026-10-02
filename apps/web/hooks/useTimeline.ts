// == KALKI B3 COMMAND ==
// React hook: fetch + subscribe to timeline posts.
// -----------------------------------------------------------------------------

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TimelinePost, TimelineVisibility } from '@/lib/timeline/types';
import {
  listTimelinePosts,
  subscribeTimeline,
  createTimelinePost,
  type CreateTimelinePostArgs,
} from '@/lib/timeline/store';

export function useTimeline(filter: {
  projectId?: string;
  orderId?: string;
  visibility?: TimelineVisibility;
}) {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTimelinePosts({ ...filter, limit: 50 });
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [filter.projectId, filter.orderId, filter.visibility]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const unsubscribe = subscribeTimeline(filter, (post) => {
      setPosts((prev) => [post, ...prev]);
    });
    return unsubscribe;
  }, [filter.projectId, filter.orderId]);

  const post = useCallback(async (args: CreateTimelinePostArgs) => {
    const created = await createTimelinePost(args);
    if (created) setPosts((prev) => [created, ...prev]);
    return created;
  }, []);

  return { posts, loading, error, refetch, post };
}
