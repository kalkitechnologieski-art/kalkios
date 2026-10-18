-- Timeline subsystem (2026-10-18)
-- The app (client dashboard, /api/timeline, lib/timeline/store) and the
-- create_service_request RPC all reference `timeline_posts`, but the table was
-- never created in the live database. That missing table is why every service
-- request failed with a 502: the RPC's final INSERT hit an undefined table and
-- aborted the whole transaction.
--
-- This migration creates the three timeline tables, indexes them, enables RLS
-- with owner-scoped policies, and registers timeline_posts for Realtime so the
-- dashboard updates the instant a request comes in.
--
-- Idempotent: safe to re-run.

-- ── 1. timeline_posts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timeline_posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID REFERENCES projects(id)   ON DELETE CASCADE,
  order_id     UUID REFERENCES orders(id)     ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  author_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  post_type    TEXT   NOT NULL DEFAULT 'system',
  content      TEXT   NOT NULL,
  visibility   TEXT   NOT NULL DEFAULT 'client',
  metadata     JSONB  NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_posts_project ON timeline_posts(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_posts_order   ON timeline_posts(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_posts_vis     ON timeline_posts(visibility);

-- ── 2. timeline_media ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timeline_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES timeline_posts(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  order_index INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_media_post ON timeline_media(post_id, order_index);

-- ── 3. timeline_reactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timeline_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES timeline_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, emoji)
);

-- ── 4. Row Level Security ─────────────────────────────────────────────────────
-- service_role (used by create_service_request) has BYPASSRLS, so the RPC writes
-- are unaffected. These policies only govern what a signed-in visitor may read.
ALTER TABLE timeline_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_media     ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS timeline_posts_read ON timeline_posts;
CREATE POLICY timeline_posts_read ON timeline_posts FOR SELECT USING (
  author_id = auth.uid()
  OR (project_id IS NOT NULL AND project_id IN (SELECT id FROM projects   WHERE client_id = auth.uid()))
  OR (order_id     IS NOT NULL AND order_id     IN (SELECT id FROM orders WHERE client_id = auth.uid()))
);

DROP POLICY IF EXISTS timeline_posts_insert ON timeline_posts;
CREATE POLICY timeline_posts_insert ON timeline_posts FOR INSERT WITH CHECK (
  author_id = auth.uid()
);

DROP POLICY IF EXISTS timeline_media_read ON timeline_media;
CREATE POLICY timeline_media_read ON timeline_media FOR SELECT USING (
  post_id IN (SELECT id FROM timeline_posts WHERE
    author_id = auth.uid()
    OR (project_id IS NOT NULL AND project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()))
    OR (order_id     IS NOT NULL AND order_id     IN (SELECT id FROM orders WHERE client_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS timeline_media_write ON timeline_media;
CREATE POLICY timeline_media_write ON timeline_media FOR INSERT WITH CHECK (
  post_id IN (SELECT id FROM timeline_posts WHERE
    author_id = auth.uid()
    OR (project_id IS NOT NULL AND project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()))
    OR (order_id     IS NOT NULL AND order_id     IN (SELECT id FROM orders WHERE client_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS timeline_reactions_read ON timeline_reactions;
CREATE POLICY timeline_reactions_read ON timeline_reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS timeline_reactions_write ON timeline_reactions;
CREATE POLICY timeline_reactions_write ON timeline_reactions FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- ── 5. Realtime ───────────────────────────────────────────────────────────────
-- Registering the table lets subscribeTimeline() receive INSERT events the
-- moment the RPC creates the kickoff post.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'timeline_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_posts;
  END IF;
END
$$;

NOTIFY pgrst, 'reload schema';
