-- Resilient service-request intake (2026-10-29)
-- create_service_request previously hard-depended on timeline_posts. On a
-- database where 20261018000002_timeline_tables.sql has not been applied, every
-- submission aborted with `relation "timeline_posts" does not exist` and the
-- client's lead was lost. Order + project + milestones are the promise; the
-- kickoff timeline post is enrichment, so it now degrades instead of failing.
--
-- Idempotent: safe to re-run.

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
  v_tracking   BOOLEAN := TRUE;
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

  -- Milestones and the kickoff post live in optional, later-migrated surfaces.
  -- Losing them must never take the order down with it.
  BEGIN
    INSERT INTO milestones (project_id, title, description, status, order_index)
    VALUES
      (v_project_id, 'Discovery Call',   'Understand goals, scope and requirements', 'pending', 0),
      (v_project_id, 'Proposal & Quote', 'Tailored scope, timeline and pricing shared', 'pending', 1),
      (v_project_id, 'Design Phase',     'UI/UX design and prototyping',               'pending', 2),
      (v_project_id, 'Development',      'Full development and implementation',        'pending', 3),
      (v_project_id, 'Launch & Delivery','Quality assurance, deployment and handover',  'pending', 4);
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    v_tracking := FALSE;
  END;

  BEGIN
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
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    v_tracking := FALSE;
  END;

  RETURN jsonb_build_object(
    'order_id',    v_order_id,
    'project_id',  v_project_id,
    'service_name', v_service.name,
    'tracking',    v_tracking
  );
END;
$$;

REVOKE ALL ON FUNCTION create_service_request(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION create_service_request(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO service_role;
