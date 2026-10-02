-- Payment fulfillment hardening (2026-10-02)
-- Atomic, idempotent, batch-scoped fulfillment replacing the 8-step
-- untransactional write sequence in /api/payments/webhook.

-- One project / one invoice per order (enables safe retry + ON CONFLICT paths)
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_order_unique
  ON projects(order_id) WHERE order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_order_unique
  ON invoices(order_id) WHERE order_id IS NOT NULL;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq;

CREATE OR REPLACE FUNCTION fulfill_paid_orders(
  p_payment_request_id TEXT,
  p_payment_id TEXT,
  p_order_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order        RECORD;
  v_service      RECORD;
  v_project_id   UUID;
  v_invoice_id   UUID;
  v_invoice_no   TEXT;
  v_tax          NUMERIC(10,2);
  v_total        NUMERIC(10,2);
  v_tax_rate     NUMERIC(5,2);
  v_project_name TEXT;
  v_results      JSONB := '[]'::jsonb;
BEGIN
  IF p_payment_request_id IS NULL AND p_order_id IS NULL THEN
    RAISE EXCEPTION 'fulfill_paid_orders requires p_payment_request_id or p_order_id';
  END IF;

  -- Row locks serialize concurrent webhook deliveries for the same batch.
  FOR v_order IN
    SELECT o.* FROM orders o
    WHERE (p_payment_request_id IS NOT NULL AND o.payment_request_id = p_payment_request_id)
       OR (p_payment_request_id IS NULL AND o.id = p_order_id)
    FOR UPDATE
  LOOP
    IF v_order.status = 'paid' THEN
      v_results := v_results || jsonb_build_array(
        jsonb_build_object('order_id', v_order.id, 'status', 'already_paid'));
      CONTINUE;
    END IF;

    UPDATE orders
       SET status = 'paid',
           payment_id = COALESCE(NULLIF(p_payment_id, ''), payment_id)
     WHERE id = v_order.id;

    v_tax   := COALESCE(v_order.tax_amount, 0);
    v_total := ROUND(COALESCE(v_order.amount, 0) + v_tax, 2);
    v_tax_rate := CASE
      WHEN COALESCE(v_order.amount, 0) > 0
      THEN ROUND(v_tax / v_order.amount * 100, 2)
      ELSE 18
    END;

    SELECT * INTO v_service FROM services WHERE id = v_order.service_id;
    v_project_name := COALESCE(v_service.name, 'Project')
      || ' for ' || COALESCE(v_order.buyer_name, 'Client');

    INSERT INTO projects (order_id, name, description, status, client_id, estimated_delivery)
    VALUES (v_order.id, v_project_name,
            'Project for ' || COALESCE(v_order.buyer_name, 'Client'),
            'not_started', v_order.client_id,
            (CURRENT_DATE + INTERVAL '30 days')::date)
    ON CONFLICT (order_id) WHERE order_id IS NOT NULL DO NOTHING
    RETURNING id INTO v_project_id;

    IF v_project_id IS NULL THEN
      -- Retry after a partial earlier run: reuse the existing project.
      SELECT id INTO v_project_id FROM projects WHERE order_id = v_order.id;
    ELSE
      INSERT INTO milestones (project_id, title, description, status, order_index)
      VALUES
        (v_project_id, 'Project Kickoff', 'Initial meeting and requirements gathering', 'pending', 0),
        (v_project_id, 'Design Phase',    'UI/UX design and prototyping',               'pending', 1),
        (v_project_id, 'Development',     'Full development and implementation',        'pending', 2),
        (v_project_id, 'Testing & QA',    'Quality assurance and bug fixing',           'pending', 3),
        (v_project_id, 'Launch',          'Final delivery and deployment',              'pending', 4);

      INSERT INTO timeline_posts (project_id, order_id, post_type, content, visibility, metadata)
      VALUES (v_project_id, v_order.id, 'system',
              'Order confirmed. Project "' || v_project_name || '" has been kicked off.',
              'client',
              jsonb_build_object(
                'serviceCategory', COALESCE(v_service.category, 'Development'),
                'projectId', v_project_id));
    END IF;

    SELECT id, invoice_number INTO v_invoice_id, v_invoice_no
      FROM invoices WHERE order_id = v_order.id LIMIT 1;

    IF v_invoice_id IS NULL THEN
      v_invoice_no := 'INV-' || to_char(now(), 'YYYYMM') || '-'
        || lpad(nextval('invoice_number_seq')::text, 6, '0');
      INSERT INTO invoices (order_id, invoice_number, total, gst, tax_rate, status, generated_at)
      VALUES (v_order.id, v_invoice_no, v_total, v_tax, v_tax_rate, 'paid', now());
    END IF;

    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'order_id',       v_order.id,
      'status',         'paid',
      'project_id',     v_project_id,
      'invoice_number', v_invoice_no,
      'amount',         COALESCE(v_order.amount, 0),
      'gst',            v_tax,
      'total',          v_total,
      'service_name',   COALESCE(v_service.name, 'Project'),
      'buyer_name',     v_order.buyer_name,
      'buyer_email',    v_order.buyer_email
    ));
  END LOOP;

  IF jsonb_array_length(v_results) = 0 THEN
    RAISE EXCEPTION 'no orders matched payment request %', COALESCE(p_payment_request_id, p_order_id::text)
      USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object('fulfilled', v_results);
END;
$$;

REVOKE ALL ON FUNCTION fulfill_paid_orders(TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fulfill_paid_orders(TEXT, TEXT, UUID) TO service_role;
