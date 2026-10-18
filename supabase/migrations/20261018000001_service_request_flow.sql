-- Service request flow (2026-10-18)
-- Replaces payment-gated checkout with an integrated, no-payment form
-- submission. An order becomes a 'submitted' request that atomically spawns a
-- project, milestones and a kickoff timeline post — all in one transaction so a
-- half-created request can never strand a client dashboard.
--
-- Idempotent: safe to re-run.

-- ── 1. Orders: request form columns ───────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company       TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS requirements  TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS brief         TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS budget        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS timeline      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source        TEXT DEFAULT 'form';

-- ── 2. Orders: allow request statuses alongside legacy payment ones ───────────
-- (Dropping+re-adding the CHECK is the only way to widen it; existing rows keep
--  their current status because every legacy value stays in the new list.)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','paid','failed','refunded','submitted','consultation','delivered'));

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);

-- ── 3. Atomic request intake RPC ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_service_request(
  p_service_id   UUID,
  p_client_id    UUID,
  p_buyer_name   TEXT,
  p_buyer_email  TEXT,
  p_buyer_phone  TEXT,
  p_company      TEXT DEFAULT NULL,
  p_requirements TEXT DEFAULT NULL,
  p_budget       TEXT DEFAULT NULL,
  p_timeline     TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service    RECORD;
  v_order_id   UUID;
  v_project_id UUID;
  v_amount     NUMERIC(10,2);
BEGIN
  IF p_service_id IS NULL THEN
    RAISE EXCEPTION 'create_service_request requires p_service_id';
  END IF;

  SELECT * INTO v_service FROM services WHERE id = p_service_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'service % not found or inactive', p_service_id
      USING ERRCODE = 'P0002';
  END IF;

  v_amount := COALESCE(v_service.price, 0);

  INSERT INTO orders (
    client_id, service_id, amount, status,
    buyer_name, buyer_email, buyer_phone,
    company, requirements, brief, budget, timeline, source
  ) VALUES (
    p_client_id, p_service_id, v_amount, 'submitted',
    p_buyer_name, p_buyer_email, p_buyer_phone,
    p_company, p_requirements, p_requirements, p_budget, p_timeline, 'form'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO projects (order_id, name, description, status, client_id, estimated_delivery)
  VALUES (
    v_order_id,
    v_service.name || ' for ' || COALESCE(p_buyer_name, 'Client'),
    COALESCE(p_requirements, 'New service request via KALKI marketplace.'),
    'not_started', p_client_id,
    (CURRENT_DATE + INTERVAL '30 days')::date
  )
  RETURNING id INTO v_project_id;

  INSERT INTO milestones (project_id, title, description, status, order_index)
  VALUES
    (v_project_id, 'Discovery Call',   'Understand goals, scope and requirements', 'pending', 0),
    (v_project_id, 'Proposal & Quote', 'Tailored scope, timeline and pricing shared', 'pending', 1),
    (v_project_id, 'Design Phase',     'UI/UX design and prototyping',               'pending', 2),
    (v_project_id, 'Development',      'Full development and implementation',        'pending', 3),
    (v_project_id, 'Launch & Delivery','Quality assurance, deployment and handover',  'pending', 4);

  INSERT INTO timeline_posts (project_id, order_id, post_type, content, visibility, metadata)
  VALUES (
    v_project_id, v_order_id, 'system',
    'Request received for "' || v_service.name || '". Our team will reach out with a tailored quote.',
    'client',
    jsonb_build_object(
      'serviceCategory', COALESCE(v_service.category, 'Services'),
      'projectId', v_project_id,
      'source', 'service_request')
  );

  RETURN jsonb_build_object(
    'order_id',   v_order_id,
    'project_id', v_project_id,
    'service_name', v_service.name
  );
END;
$$;

REVOKE ALL ON FUNCTION create_service_request(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_service_request(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO service_role;
