-- Industry-grade RLS (2026-10-02)
-- SECURITY DEFINER role helpers (no recursion), owner-or-staff policies across
-- every user-facing table, column guards against client-side money/status
-- tampering, and role-escalation protection.

-- ─── Helpers ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT role FROM profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT COALESCE(current_user_role() IN ('ceo','admin','manager'), FALSE) $$;

CREATE OR REPLACE FUNCTION is_staff() RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT COALESCE(current_user_role() IN
     ('ceo','admin','manager','developer','support','hr','employee'), FALSE) $$;

GRANT EXECUTE ON FUNCTION current_user_role(), is_admin(), is_staff() TO anon, authenticated, service_role;

-- ─── Column guards ─────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_order
  ON reviews(user_id, order_id) WHERE order_id IS NOT NULL;

-- Logged-in non-staff may not mutate sensitive order columns via their session.
CREATE OR REPLACE FUNCTION trg_orders_guard_columns() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_staff() THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.amount IS DISTINCT FROM OLD.amount
       OR NEW.subtotal IS DISTINCT FROM OLD.subtotal
       OR NEW.tax_amount IS DISTINCT FROM OLD.tax_amount
       OR NEW.discount_amount IS DISTINCT FROM OLD.discount_amount
       OR NEW.discount_code IS DISTINCT FROM OLD.discount_code
       OR NEW.code_id IS DISTINCT FROM OLD.code_id
       OR NEW.payment_id IS DISTINCT FROM OLD.payment_id
       OR NEW.payment_request_id IS DISTINCT FROM OLD.payment_request_id
       OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.service_id IS DISTINCT FROM OLD.service_id THEN
      RAISE EXCEPTION 'order fields require staff privileges'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_guard_columns ON orders;
CREATE TRIGGER orders_guard_columns
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION trg_orders_guard_columns();

-- Only admins (or service contexts) may change a profile's role.
CREATE OR REPLACE FUNCTION trg_profiles_role_guard() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'role modification requires admin privileges'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_role_guard ON profiles;
CREATE TRIGGER profiles_role_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trg_profiles_role_guard();

-- ─── Ensure RLS everywhere ─────────────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','services','orders','projects','milestones','messages','invoices',
    'timeline_posts','reviews','codes','code_redemptions','code_usage_velocity',
    'referral_config','referral_tiers','referral_events','referral_rewards','referral_frauds',
    'leads','lead_search_sessions','webhook_failures','admin_actions','audit_logs','ai_audit_logs',
    'invites','payout_batches','payout_items','tasks','time_entries','cart_recovery',
    'job_postings','job_applications','product_variants','review_media','review_responses',
    'timeline_reactions'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ─── profiles ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (id = auth.uid() OR is_staff());
CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());
-- No delete policy: only service role (account deletion RPC/route) can delete.

-- ─── services (public catalogue) ───────────────────────────────────
DROP POLICY IF EXISTS services_select ON services;
CREATE POLICY services_select ON services
  FOR SELECT USING (published_status = 'live' OR is_admin());
CREATE POLICY services_write ON services
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY services_update ON services
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY services_delete ON services
  FOR DELETE USING (is_admin());

-- ─── orders ────────────────────────────────────────────────────────
CREATE POLICY orders_select ON orders
  FOR SELECT USING (client_id = auth.uid() OR is_staff());
CREATE POLICY orders_insert ON orders
  FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY orders_update ON orders
  FOR UPDATE USING (client_id = auth.uid() OR is_staff())
  WITH CHECK (client_id = auth.uid() OR is_staff());
CREATE POLICY orders_delete ON orders
  FOR DELETE USING (is_admin());

-- ─── projects ──────────────────────────────────────────────────────
CREATE POLICY projects_select ON projects
  FOR SELECT USING (client_id = auth.uid() OR is_staff());
CREATE POLICY projects_insert ON projects
  FOR INSERT WITH CHECK (is_staff());
CREATE POLICY projects_update ON projects
  FOR UPDATE USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY projects_delete ON projects
  FOR DELETE USING (is_admin());

-- ─── milestones (visible via owning project) ───────────────────────
CREATE POLICY milestones_select ON milestones
  FOR SELECT USING (
    is_staff()
    OR EXISTS (SELECT 1 FROM projects p
               WHERE p.id = milestones.project_id AND p.client_id = auth.uid())
  );
CREATE POLICY milestones_write ON milestones
  FOR INSERT WITH CHECK (is_staff());
CREATE POLICY milestones_update ON milestones
  FOR UPDATE USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY milestones_delete ON milestones
  FOR DELETE USING (is_staff());

-- ─── invoices ──────────────────────────────────────────────────────
CREATE POLICY invoices_select ON invoices
  FOR SELECT USING (
    is_staff()
    OR EXISTS (SELECT 1 FROM orders o
               WHERE o.id = invoices.order_id AND o.client_id = auth.uid())
  );
CREATE POLICY invoices_insert ON invoices FOR INSERT WITH CHECK (is_staff());
CREATE POLICY invoices_update ON invoices FOR UPDATE USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY invoices_delete ON invoices FOR DELETE USING (is_admin());

-- ─── messages ──────────────────────────────────────────────────────
CREATE POLICY messages_select ON messages
  FOR SELECT USING (
    sender_id = auth.uid()
    OR is_staff()
    OR EXISTS (SELECT 1 FROM projects p
               WHERE p.id = messages.project_id AND p.client_id = auth.uid())
  );
CREATE POLICY messages_insert ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid() OR is_staff());
CREATE POLICY messages_update ON messages
  FOR UPDATE USING (is_staff()
    OR EXISTS (SELECT 1 FROM projects p
               WHERE p.id = messages.project_id AND p.client_id = auth.uid()));

-- ─── timeline_posts ────────────────────────────────────────────────
CREATE POLICY timeline_select ON timeline_posts
  FOR SELECT USING (
    is_staff()
    OR (visibility = 'client' AND (
          EXISTS (SELECT 1 FROM projects p WHERE p.id = timeline_posts.project_id AND p.client_id = auth.uid())
          OR EXISTS (SELECT 1 FROM orders o WHERE o.id = timeline_posts.order_id AND o.client_id = auth.uid())
        ))
  );
CREATE POLICY timeline_insert ON timeline_posts
  FOR INSERT WITH CHECK (
    (is_staff() OR author_id = auth.uid())
    AND (visibility = 'client' OR is_staff())
  );
CREATE POLICY timeline_update ON timeline_posts FOR UPDATE USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY timeline_delete ON timeline_posts FOR DELETE USING (is_admin() OR author_id = auth.uid());

-- ─── reviews ───────────────────────────────────────────────────────
CREATE POLICY reviews_select ON reviews
  FOR SELECT USING (status = 'approved' OR user_id = auth.uid() OR is_staff());
CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY reviews_update ON reviews FOR UPDATE USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY reviews_delete ON reviews FOR DELETE USING (is_staff());

-- ─── codes & redemptions ───────────────────────────────────────────
-- Active codes are readable so checkout validation works for clients;
-- mutations are staff-only and redemption goes through redeem_code().
CREATE POLICY codes_select ON codes FOR SELECT USING (is_staff() OR status = 'active');
CREATE POLICY codes_write ON codes FOR INSERT WITH CHECK (is_admin());
CREATE POLICY codes_update ON codes FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY codes_delete ON codes FOR DELETE USING (is_admin());

CREATE POLICY redemptions_select ON code_redemptions FOR SELECT USING (is_staff());
CREATE POLICY redemptions_insert ON code_redemptions FOR INSERT WITH CHECK (is_staff());

CREATE POLICY velocity_select ON code_usage_velocity FOR SELECT USING (is_staff());
CREATE POLICY velocity_write ON code_usage_velocity FOR INSERT WITH CHECK (is_staff());

-- ─── referral ──────────────────────────────────────────────────────
CREATE POLICY referral_config_select ON referral_config FOR SELECT USING (is_staff());
CREATE POLICY referral_config_write ON referral_config FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY referral_tiers_select ON referral_tiers FOR SELECT USING (is_staff());
CREATE POLICY referral_tiers_write ON referral_tiers FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY referral_events_select ON referral_events
  FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid() OR is_staff());
CREATE POLICY referral_events_update ON referral_events
  FOR UPDATE USING (is_staff()) WITH CHECK (is_staff());
-- referral_events inserts happen only through the authenticated API (service role) + unique referee index.

CREATE POLICY referral_rewards_select ON referral_rewards
  FOR SELECT USING (user_id = auth.uid() OR is_staff());
CREATE POLICY referral_rewards_write ON referral_rewards FOR ALL USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY referral_frauds_select ON referral_frauds FOR SELECT USING (is_staff());
CREATE POLICY referral_frauds_write ON referral_frauds FOR ALL USING (is_staff()) WITH CHECK (is_staff());

-- ─── leads / scraping / webhooks / audits (staff only) ─────────────
DROP POLICY IF EXISTS "Admins and HR can manage leads" ON leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
CREATE POLICY leads_all ON leads FOR ALL USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY lead_sessions_all ON lead_search_sessions FOR ALL USING (is_staff()) WITH CHECK (is_staff());
-- webhook_failures: no policies → service role only.
CREATE POLICY admin_actions_select ON admin_actions FOR SELECT USING (is_staff());
CREATE POLICY admin_actions_insert ON admin_actions FOR INSERT WITH CHECK (is_staff());
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT USING (is_staff());
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT WITH CHECK (is_staff());
CREATE POLICY ai_audit_select ON ai_audit_logs FOR SELECT USING (is_staff());
CREATE POLICY ai_audit_insert ON ai_audit_logs FOR INSERT WITH CHECK (is_staff());

-- ─── invites / payouts ─────────────────────────────────────────────
CREATE POLICY invites_select ON invites
  FOR SELECT USING (email = auth.email() OR is_admin());
CREATE POLICY invites_write ON invites FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY payout_batches_select ON payout_batches FOR SELECT USING (is_staff());
CREATE POLICY payout_batches_write ON payout_batches FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY payout_items_select ON payout_items FOR SELECT USING (is_staff());
CREATE POLICY payout_items_write ON payout_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── tasks / time entries / cart recovery ──────────────────────────
CREATE POLICY tasks_select ON tasks
  FOR SELECT USING (assigned_to = auth.uid() OR is_staff());
CREATE POLICY tasks_insert ON tasks FOR INSERT WITH CHECK (is_staff());
CREATE POLICY tasks_update ON tasks FOR UPDATE USING (assigned_to = auth.uid() OR is_staff()) WITH CHECK (assigned_to = auth.uid() OR is_staff());
CREATE POLICY tasks_delete ON tasks FOR DELETE USING (is_admin());

CREATE POLICY time_entries_select ON time_entries FOR SELECT USING (user_id = auth.uid() OR is_staff());
CREATE POLICY time_entries_insert ON time_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY time_entries_update ON time_entries FOR UPDATE USING (user_id = auth.uid() OR is_staff()) WITH CHECK (user_id = auth.uid() OR is_staff());
CREATE POLICY time_entries_delete ON time_entries FOR DELETE USING (is_staff());

CREATE POLICY cart_recovery_select ON cart_recovery FOR SELECT USING (user_id = auth.uid() OR is_staff());
CREATE POLICY cart_recovery_write ON cart_recovery FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY cart_recovery_update ON cart_recovery FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ─── hiring (replace recursive admin checks with helpers) ──────────
DROP POLICY IF EXISTS "Admins and HR can manage job postings" ON job_postings;
DROP POLICY IF EXISTS "Admins, HR, and assigned can manage applications" ON job_applications;
CREATE POLICY postings_write ON job_postings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY applications_manage ON job_applications
  FOR ALL USING (is_admin() OR assigned_to = auth.uid())
  WITH CHECK (is_admin() OR assigned_to = auth.uid());

-- ─── product variants / review extras / reactions ──────────────────
CREATE POLICY variants_write ON product_variants
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY review_media_select ON review_media
  FOR SELECT USING (is_staff() OR EXISTS (
    SELECT 1 FROM reviews r WHERE r.id = review_media.review_id
      AND (r.user_id = auth.uid() OR r.status = 'approved')));
CREATE POLICY review_media_insert ON review_media
  FOR INSERT WITH CHECK (is_staff() OR EXISTS (
    SELECT 1 FROM reviews r WHERE r.id = review_media.review_id AND r.user_id = auth.uid()));
CREATE POLICY review_responses_select ON review_responses
  FOR SELECT USING (is_staff() OR EXISTS (
    SELECT 1 FROM reviews r WHERE r.id = review_responses.review_id AND r.status = 'approved'));
CREATE POLICY review_responses_insert ON review_responses
  FOR INSERT WITH CHECK (is_staff());

DROP POLICY IF EXISTS reactions_select ON timeline_reactions;
CREATE POLICY reactions_select ON timeline_reactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY reactions_insert ON timeline_reactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY reactions_delete ON timeline_reactions FOR DELETE USING (user_id = auth.uid() OR is_admin());
