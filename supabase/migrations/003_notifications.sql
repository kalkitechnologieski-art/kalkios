-- ============================================================================
-- KALKI OS — Notifications & Preferences
-- ============================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('welcome', 'token_milestone', 'chat', 'project_update', 'system', 'task')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  chat_notifications BOOLEAN DEFAULT true,
  token_milestones BOOLEAN DEFAULT true,
  project_updates BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User token usage tracking
CREATE TABLE IF NOT EXISTS user_token_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tokens_used INT DEFAULT 0,
  last_milestone INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_user_token_usage_user_id ON user_token_usage(user_id);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_token_usage ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can read their own
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Notifications: System can insert
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Notifications: Users can update their own (mark read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Preferences: Users can read/update their own
CREATE POLICY "Users can manage own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- User token usage: Users can read their own
CREATE POLICY "Users can read own token usage" ON user_token_usage
  FOR SELECT USING (auth.uid() = user_id);

-- User token usage: System can insert/update
CREATE POLICY "System can manage token usage" ON user_token_usage
  FOR ALL USING (true);

-- Enable realtime
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Function: handle token milestone notifications
CREATE OR REPLACE FUNCTION check_token_milestone()
RETURNS TRIGGER AS $$
DECLARE
  milestone INT;
  current_milestone INT;
  user_prefs BOOLEAN;
BEGIN
  -- Get current milestone
  SELECT last_milestone INTO current_milestone
  FROM user_token_usage
  WHERE user_id = NEW.user_id;
  
  IF current_milestone IS NULL THEN
    current_milestone := 0;
  END IF;
  
  -- Check if user crossed a milestone (every 1000 tokens)
  IF NEW.tokens_used >= current_milestone + 1000 THEN
    -- Calculate the milestone number
    milestone := floor(NEW.tokens_used / 1000) * 1000;
    
    -- Check if user wants token milestone notifications
    SELECT token_milestones INTO user_prefs
    FROM notification_preferences
    WHERE user_id = NEW.user_id;
    
    IF user_prefs IS NULL OR user_prefs = true THEN
      -- Insert notification
      INSERT INTO notifications (user_id, type, title, message, data)
      VALUES (
        NEW.user_id,
        'token_milestone',
        '🎯 Token Milestone Reached!',
        'You have used ' || NEW.tokens_used || ' tokens. Keep up the great work!',
        jsonb_build_object('tokens_used', NEW.tokens_used, 'milestone', milestone)
      );
    END IF;
    
    -- Update last milestone
    UPDATE user_token_usage
    SET last_milestone = milestone
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for token milestone
DROP TRIGGER IF EXISTS check_token_milestone_trigger ON user_token_usage;
CREATE TRIGGER check_token_milestone_trigger
  AFTER INSERT OR UPDATE OF tokens_used ON user_token_usage
  FOR EACH ROW
  EXECUTE FUNCTION check_token_milestone();

-- Function: create welcome notification on profile creation
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert welcome notification
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    NEW.id,
    'welcome',
    '👋 Welcome to KALKI OS!',
    'Welcome to the Temple of Technology! Explore our services, chat with Siddhi, and start building the future.'
  );
  
  -- Create notification preferences
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create token usage record
  INSERT INTO user_token_usage (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for welcome notification
DROP TRIGGER IF EXISTS create_welcome_notification_trigger ON profiles;
CREATE TRIGGER create_welcome_notification_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_welcome_notification();

-- === SIDDHI v4.0 BATCH 3 - OBSERVABILITY ===

CREATE TABLE IF NOT EXISTS siddhi_logs (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('debug','info','warn','error','fatal')),
  msg TEXT NOT NULL,
  correlation_id TEXT,
  session_id TEXT,
  user_id TEXT,
  layer TEXT,
  duration_ms INT,
  outcome TEXT,
  error JSONB,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_siddhi_logs_ts ON siddhi_logs(ts DESC);
CREATE INDEX IF NOT EXISTS idx_siddhi_logs_corr ON siddhi_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_siddhi_logs_layer ON siddhi_logs(layer);
CREATE INDEX IF NOT EXISTS idx_siddhi_logs_level ON siddhi_logs(level);

ALTER TABLE siddhi_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read siddhi logs" ON siddhi_logs;
CREATE POLICY "Admins read siddhi logs" ON siddhi_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin'))
  );

DROP POLICY IF EXISTS "Service insert siddhi logs" ON siddhi_logs;
CREATE POLICY "Service insert siddhi logs" ON siddhi_logs
  FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS siddhi_telemetry (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  correlation_id TEXT,
  session_id TEXT,
  user_id TEXT,
  layer TEXT,
  duration_ms INT,
  tokens INT,
  success BOOLEAN NOT NULL DEFAULT true,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_siddhi_telemetry_created ON siddhi_telemetry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_siddhi_telemetry_layer ON siddhi_telemetry(layer);

ALTER TABLE siddhi_telemetry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read siddhi telemetry" ON siddhi_telemetry;
CREATE POLICY "Admins read siddhi telemetry" ON siddhi_telemetry
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin'))
  );

DROP POLICY IF EXISTS "Service insert siddhi telemetry" ON siddhi_telemetry;
CREATE POLICY "Service insert siddhi telemetry" ON siddhi_telemetry
  FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS siddhi_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_siddhi_memory_user_session ON siddhi_memory(user_id, session_id, created_at);

ALTER TABLE siddhi_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own siddhi memory" ON siddhi_memory;
CREATE POLICY "Users manage own siddhi memory" ON siddhi_memory
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION siddhi_gc_old_logs() RETURNS void AS $$
BEGIN
  DELETE FROM siddhi_logs WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM siddhi_telemetry WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- == KALKI B1 SPINE ==
-- Enterprise commerce spine: variants, reviews, timeline, codes,
-- referral, payouts, fraud, webhook retry, cart recovery.

-- ─── Product variants ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  duration_days INT,
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_variants_service ON product_variants(service_id, order_index);

-- ─── Reviews ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  helpful_count INT DEFAULT 0,
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

CREATE TABLE IF NOT EXISTS review_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Timeline posts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timeline_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('system','milestone','deliverable','question','client_file','note','update')),
  content TEXT NOT NULL,
  visibility TEXT DEFAULT 'client' CHECK (visibility IN ('client','admin')),
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_timeline_project ON timeline_posts(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_order ON timeline_posts(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS timeline_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES timeline_posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT,
  order_index INT DEFAULT 0
);

-- ─── Unified codes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  code_type TEXT NOT NULL CHECK (code_type IN ('promo','referral','gift','tier','trial')),
  name TEXT,
  description TEXT,
  owner_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed','tiered','bogo','shipping','bundle')),
  discount_value NUMERIC(10,2) DEFAULT 0,
  discount_config JSONB DEFAULT '{}'::jsonb,
  rules JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','paused','expired','exhausted')),
  total_uses INT DEFAULT 0,
  total_discount_given NUMERIC(12,2) DEFAULT 0,
  total_revenue_generated NUMERIC(12,2) DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_codes_code ON codes(code);
CREATE INDEX IF NOT EXISTS idx_codes_status ON codes(status, code_type);
CREATE INDEX IF NOT EXISTS idx_codes_owner ON codes(owner_user_id);

CREATE TABLE IF NOT EXISTS code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_applied NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_breakdown JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_redemptions_code ON code_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON code_redemptions(user_id);

-- ─── Referral ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','converted','rewarded','expired','fraud')),
  converted_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  referrer_reward_amount NUMERIC(10,2),
  referrer_reward_type TEXT,
  referee_discount_amount NUMERIC(10,2),
  attribution_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON referral_events(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referral_events_referee ON referral_events(referee_id);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_event_id UUID REFERENCES referral_events(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'credit',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','available','redeemed','paid','expired')),
  expires_at TIMESTAMPTZ,
  redeemed_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  payout_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id, status);

CREATE TABLE IF NOT EXISTS referral_frauds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_event_id UUID REFERENCES referral_events(id) ON DELETE CASCADE,
  fraud_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high')),
  details JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Payouts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT UNIQUE NOT NULL,
  total_amount NUMERIC(12,2) DEFAULT 0,
  total_users INT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES payout_batches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Ops: webhook retry + cart recovery ─────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  payload JSONB NOT NULL,
  error TEXT,
  attempts INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_failures_retry ON webhook_failures(resolved, next_retry_at);

CREATE TABLE IF NOT EXISTS cart_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT,
  items_json JSONB NOT NULL,
  total_amount NUMERIC(10,2),
  emailed_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  converted_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cart_recovery_user ON cart_recovery(user_id, converted, emailed_at);

-- ─── Column additions on existing tables ────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS code_id UUID REFERENCES codes(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_event_id UUID REFERENCES referral_events(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_credit_applied NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_referrals INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_referral_earnings NUMERIC(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard';
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;

ALTER TABLE services ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS og_image_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS aeo_summary TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS geo_keywords TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS schema_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS eligible_for_codes BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS eligible_for_referral BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS published_status TEXT DEFAULT 'live' CHECK (published_status IN ('draft','live','archived'));

ALTER TABLE projects ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_gstin TEXT;

-- ─── RLS policies ───────────────────────────────────────────────────
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_frauds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "variants public read" ON product_variants;
CREATE POLICY "variants public read" ON product_variants FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "variants admin write" ON product_variants;
CREATE POLICY "variants admin write" ON product_variants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin','manager'))
);

DROP POLICY IF EXISTS "reviews public read approved" ON reviews;
CREATE POLICY "reviews public read approved" ON reviews FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);
DROP POLICY IF EXISTS "reviews user insert" ON reviews;
CREATE POLICY "reviews user insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "reviews admin manage" ON reviews;
CREATE POLICY "reviews admin manage" ON reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin','manager'))
);

DROP POLICY IF EXISTS "timeline client read" ON timeline_posts;
CREATE POLICY "timeline client read" ON timeline_posts FOR SELECT USING (
  visibility = 'client' OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin','manager','employee'))
);

DROP POLICY IF EXISTS "codes admin only" ON codes;
CREATE POLICY "codes admin only" ON codes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin','manager'))
);

DROP POLICY IF EXISTS "referral own read" ON referral_events;
CREATE POLICY "referral own read" ON referral_events FOR SELECT USING (
  auth.uid() = referrer_id OR auth.uid() = referee_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin'))
);

DROP POLICY IF EXISTS "rewards own read" ON referral_rewards;
CREATE POLICY "rewards own read" ON referral_rewards FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin'))
);

DROP POLICY IF EXISTS "payouts admin only" ON payout_batches;
CREATE POLICY "payouts admin only" ON payout_batches FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin'))
);

DROP POLICY IF EXISTS "webhook failures admin" ON webhook_failures;
CREATE POLICY "webhook failures admin" ON webhook_failures FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin'))
);

DROP POLICY IF EXISTS "cart recovery own" ON cart_recovery;
CREATE POLICY "cart recovery own" ON cart_recovery FOR ALL USING (auth.uid() = user_id);

-- == KALKI B2 ENGINES ==
-- Referral + code lifecycle enhancements.
-- Adds: config table, referral code index, reward tiers, code analytics.

CREATE TABLE IF NOT EXISTS referral_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO referral_config (key, value) VALUES
  ('program_enabled', 'true'::jsonb),
  ('referrer_reward_type', '"credit"'::jsonb),
  ('referrer_reward_value', '500'::jsonb),
  ('referee_discount_type', '"percentage"'::jsonb),
  ('referee_discount_value', '20'::jsonb),
  ('min_purchase', '1000'::jsonb),
  ('attribution_window_days', '30'::jsonb),
  ('reward_expiry_days', '90'::jsonb),
  ('max_referrals_per_user', '0'::jsonb),
  ('max_referrals_per_month', '20'::jsonb),
  ('velocity_cap_per_ip_per_day', '5'::jsonb),
  ('payout_minimum', '500'::jsonb),
  ('fraud_check_level', '"standard"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Referral reward tiers (B2B tiered rewards)
CREATE TABLE IF NOT EXISTS referral_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_referrals INT NOT NULL,
  reward_multiplier NUMERIC(5,2) DEFAULT 1.0,
  bonus_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO referral_tiers (name, min_referrals, reward_multiplier, bonus_amount) VALUES
  ('Bronze', 0, 1.0, 0),
  ('Silver', 5, 1.25, 250),
  ('Gold', 15, 1.5, 1000),
  ('Platinum', 50, 2.0, 5000)
ON CONFLICT DO NOTHING;

-- Code usage velocity (fraud tracking)
CREATE TABLE IF NOT EXISTS code_usage_velocity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES codes(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_code_velocity ON code_usage_velocity(code_id, ip_hash, redeemed_at DESC);

-- Referral code index (fast lookup)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code_v2
  ON profiles(LOWER(referral_code))
  WHERE referral_code IS NOT NULL;

-- Analytics helper view
CREATE OR REPLACE VIEW referral_funnel AS
SELECT
  DATE_TRUNC('day', re.created_at)::DATE AS day,
  COUNT(*) FILTER (WHERE re.status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE re.status = 'converted') AS converted_count,
  COUNT(*) FILTER (WHERE re.status = 'rewarded') AS rewarded_count,
  COUNT(*) FILTER (WHERE re.status = 'fraud') AS fraud_count,
  COALESCE(SUM(re.referrer_reward_amount) FILTER (WHERE re.status = 'rewarded'), 0) AS total_rewards_paid
FROM referral_events re
GROUP BY day
ORDER BY day DESC;

GRANT SELECT ON referral_funnel TO authenticated;

-- == KALKI B3 COMMAND ==
-- Command Center: timeline posting, order timeline, activity log views.

-- Timeline post reactions
CREATE TABLE IF NOT EXISTS timeline_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES timeline_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL DEFAULT '👍',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_timeline_reactions_post ON timeline_reactions(post_id);

-- Admin action log (every sensitive op)
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_actions_actor ON admin_actions(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_table, target_id);

-- Views for command center KPIs
CREATE OR REPLACE VIEW admin_kpis_daily AS
SELECT
  DATE_TRUNC('day', created_at)::DATE AS day,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid_orders,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_orders,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS revenue
FROM orders
GROUP BY day
ORDER BY day DESC;

GRANT SELECT ON admin_kpis_daily TO authenticated;

CREATE OR REPLACE VIEW admin_top_services AS
SELECT
  s.id,
  s.name,
  s.category,
  COUNT(o.id) FILTER (WHERE o.status = 'paid') AS paid_count,
  COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'paid'), 0) AS revenue
FROM services s
LEFT JOIN orders o ON o.service_id = s.id
GROUP BY s.id, s.name, s.category
ORDER BY revenue DESC
LIMIT 20;

GRANT SELECT ON admin_top_services TO authenticated;

ALTER TABLE timeline_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions auth read" ON timeline_reactions;
CREATE POLICY "reactions auth read" ON timeline_reactions FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "reactions own write" ON timeline_reactions;
CREATE POLICY "reactions own write" ON timeline_reactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin actions admin read" ON admin_actions;
CREATE POLICY "admin actions admin read" ON admin_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ceo','admin'))
);

DROP POLICY IF EXISTS "admin actions service insert" ON admin_actions;
CREATE POLICY "admin actions service insert" ON admin_actions FOR INSERT WITH CHECK (true);
