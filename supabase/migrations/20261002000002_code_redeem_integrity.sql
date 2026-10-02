-- Code redemption integrity + referral dedup (2026-10-02)

-- One redemption per (code, order); one referral event per referee lifetime.
CREATE UNIQUE INDEX IF NOT EXISTS idx_redemptions_code_order
  ON code_redemptions(code_id, order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_events_referee
  ON referral_events(referee_id) WHERE referee_id IS NOT NULL;

-- Atomic redemption: locks the code row, enforces max uses from rules JSONB,
-- records the redemption, and increments usage in one transaction.
CREATE OR REPLACE FUNCTION redeem_code(
  p_code_id UUID,
  p_user_id UUID,
  p_order_id UUID,
  p_discount NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code        RECORD;
  v_max_uses    INT;
  v_per_user    INT;
  v_user_count  INT;
BEGIN
  SELECT * INTO v_code FROM codes WHERE id = p_code_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'code not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_code.status <> 'active' THEN
    RAISE EXCEPTION 'code is not active' USING ERRCODE = 'P0003';
  END IF;

  v_max_uses := COALESCE((v_code.rules->>'max_uses')::int,
                         (v_code.rules->>'maxUses')::int, 0);
  IF v_max_uses > 0 AND v_code.total_uses >= v_max_uses THEN
    RAISE EXCEPTION 'code exhausted' USING ERRCODE = 'P0004';
  END IF;

  v_per_user := COALESCE((v_code.rules->>'max_per_user')::int,
                         (v_code.rules->>'maxPerUser')::int, 0);
  IF v_per_user > 0 AND p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_count
      FROM code_redemptions WHERE code_id = p_code_id AND user_id = p_user_id;
    IF v_user_count >= v_per_user THEN
      RAISE EXCEPTION 'user limit reached for code' USING ERRCODE = 'P0005';
    END IF;
  END IF;

  INSERT INTO code_redemptions (code_id, user_id, order_id, discount_applied)
  VALUES (p_code_id, p_user_id, p_order_id, COALESCE(p_discount, 0));

  UPDATE codes
     SET total_uses = COALESCE(total_uses, 0) + 1,
         total_discount_given = COALESCE(total_discount_given, 0) + COALESCE(p_discount, 0),
         updated_at = now()
   WHERE id = p_code_id;

  RETURN jsonb_build_object('code_id', p_code_id, 'total_uses', v_code.total_uses + 1);
END;
$$;

REVOKE ALL ON FUNCTION redeem_code(UUID, UUID, UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION redeem_code(UUID, UUID, UUID, NUMERIC) TO service_role;
